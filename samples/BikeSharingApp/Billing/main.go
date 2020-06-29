// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"os/signal"
	"syscall"

	"sync"

	"github.com/gorilla/mux"
)

const (
	mongoDbConnectionStringEnvName = "mongo_connectionstring"
	mongoDbNameEnvName             = "mongo_dbname"
)

var (
	EnvMongoDbConnectionString = os.Getenv(mongoDbConnectionStringEnvName)
	EnvMongoDbName             = os.Getenv(mongoDbNameEnvName)
)

var (
	DbConnection *MongoDbConnection
)

var envOpts = map[string]string{
	mongoDbConnectionStringEnvName: EnvMongoDbConnectionString,
	mongoDbNameEnvName:             EnvMongoDbName,
}

const (
	listenPort = 80
)

var ShutdownSignal = sync.NewCond(&sync.Mutex{})
var ShutdownWaitGroup = &sync.WaitGroup{}

func init() {
	Log("Billing init()")
	var err error

	envOptsJSON, err := json.Marshal(envOpts)
	if err != nil {
		LogError(err)
		shutdown()
	}
	Log("Environment options: %s", string(envOptsJSON))
	if EnvMongoDbConnectionString == "" {
		EnvMongoDbConnectionString = "mongodb://databases-mongo"
	}
	if EnvMongoDbName == "" {
		EnvMongoDbName = "billing"
	}

	DbConnection, err = NewDbConnection("DbConnection", EnvMongoDbConnectionString, EnvMongoDbName, ShutdownWaitGroup)
	// DbConnection.collection.remove()
	if err != nil {
		LogErrFormat("MongoDb connection: %v", err)
		LogErrFormat("Exiting")
		shutdown()
	}
	go listenForUnexpectedMongoDbShutdown(DbConnection)

	// Define a channel that will be called when the OS wants the program to exit
	// This will be used to gracefully shutdown the consumer
	osChan := make(chan os.Signal, 5)
	signal.Notify(osChan, syscall.SIGINT, syscall.SIGKILL, syscall.SIGTERM, syscall.SIGABRT, syscall.SIGQUIT)
	go func() {
		LogErrFormat("OS signal received: %v", <-osChan)
		shutdown()
	}()
}

func main() {
	Log("Billing startup")

	Log("Setting up HTTP handlers")
	r := mux.NewRouter()
	r.Handle("/hello", EndpointHandlerNoContext(HelloHandler)).Methods(http.MethodGet)
	r.Handle("/api/invoice", EndpointHandler(NewInvoiceHandler)).Methods(http.MethodPost)
	r.Handle("/api/invoice/{id}", EndpointHandler(GetInvoiceHandler)).Methods(http.MethodGet)
	r.Handle("/api/customer", EndpointHandler(NewCustomerHandler)).Methods(http.MethodPost)
	r.Handle("/api/customer", EndpointHandler(UpdateCustomerHandler)).Methods(http.MethodPatch)
	r.Handle("/api/customer/{userID}", EndpointHandler(GetCustomerByUserIdHandler)).Methods(http.MethodGet)
	r.Handle("/api/customer/{userID}/invoices", EndpointHandler(GetInvoicesForCustomerHandler)).Methods(http.MethodGet)
	r.Handle("/api/vendor", EndpointHandler(NewVendorHandler)).Methods(http.MethodPost)
	r.Handle("/api/vendor", EndpointHandler(UpdateVendorHandler)).Methods(http.MethodPatch)
	r.Handle("/api/vendor/{userID}", EndpointHandler(GetVendorByUserIdHandler)).Methods(http.MethodGet)
	r.Handle("/api/vendor/{userID}/invoices", EndpointHandler(GetInvoicesForVendorHandler)).Methods(http.MethodGet)
	r.Handle("/api/reservation/{resID}/invoice", EndpointHandler(GetInvoiceForReservationIdHandler)).Methods(http.MethodGet)

	srv := &http.Server{
		Handler:      r,
		Addr:         fmt.Sprintf("0.0.0.0:%d", listenPort),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	go func() {
		Log("Listening on %d...", listenPort)
		LogErrFormat("Webserver shutdown unexpectedly!: %v", srv.ListenAndServe())
		shutdown()
	}()

	ShutdownWaitGroup.Wait()
	Log("Billing graceful shutdown.")
}

var unexpectedShutdownOnce sync.Once

func listenForUnexpectedMongoDbShutdown(conn *MongoDbConnection) {
	shutdownChan := make(chan struct{}, 1)
	go func() {
		ShutdownSignal.L.Lock()
		ShutdownSignal.Wait()
		ShutdownSignal.L.Unlock()
		shutdownChan <- struct{}{}
	}()

	defer func() {
		if r := recover(); r != nil {
			LogErrFormat("Panic while pinging MongoDb: %v", r)
			unexpectedShutdownOnce.Do(shutdown)
		}
	}()

checkLoop:
	for {
		select {
		case <-shutdownChan:
			Log("'%s' graceful shutdown", conn.Name)
			break checkLoop
		default:
			// Do nothing
		}

		if err := conn.Ping(); err != nil {
			LogErrFormat("'%s' MongoDbConnection shut down unexpectedly!", conn.Name)
			unexpectedShutdownOnce.Do(shutdown)
		}

		time.Sleep(3 * time.Second)
	}
}

func shutdown() {
	Log("Shutting down!")
	ShutdownSignal.Broadcast()

	if DbConnection != nil {
		DbConnection.Shutdown()
	}

	Log("Waiting for handlers to exit")
	ShutdownWaitGroup.Wait()
	Log("All handlers done.")
}
