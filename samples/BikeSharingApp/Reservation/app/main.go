// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"fmt"
	"os"
	"sync"

	"github.com/gorilla/mux"
)

var (
	DbConnection   *MongoHelper
	ShutdownSignal = sync.NewCond(&sync.Mutex{})
	ShutdownWg     = &sync.WaitGroup{}
	Port           = 80
)

func init() {
	DbConnection = CreateMongoConnection()
	ShutdownWg.Add(1)
	go listenForUnexpectedMongoDbShutdown(DbConnection)

	// Define a channel that will be called when the OS wants the program to exit
	// This will be used to gracefully shutdown the app
	osChan := make(chan os.Signal, 5)
	signal.Notify(osChan, syscall.SIGINT, syscall.SIGKILL, syscall.SIGTERM, syscall.SIGABRT, syscall.SIGQUIT)
	go func() {
		fmt.Fprintf(os.Stderr, "OS signal received: %v\n", <-osChan)
		shutdown()
	}()
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/hello", HelloHandler).Methods(http.MethodGet)
	r.HandleFunc("/api/allReservations", getAllReservationsHandler).Methods(http.MethodGet)
	r.HandleFunc("/api/reservation", addReservationHandler).Methods(http.MethodPost)
	r.HandleFunc("/api/reservation/{reservationId}", getReservationHandler).Methods(http.MethodGet)
	r.HandleFunc("/api/user/{userId}/reservations", listReservationsHandler).Methods(http.MethodGet)
	go func() {
		LogInfo("Listening on port: %d", Port)
		fmt.Fprintf(os.Stderr, "%v\n", http.ListenAndServe(fmt.Sprintf(":%d", Port), r))
		shutdown()
	}()

	ShutdownWg.Wait()
	fmt.Println("Graceful shutdown.")
}

var unexpectedShutdownOnce sync.Once

func listenForUnexpectedMongoDbShutdown(conn *MongoHelper) {
	shutdownChan := make(chan struct{}, 1)
	go func() {
		ShutdownSignal.L.Lock()
		ShutdownSignal.Wait()
		ShutdownSignal.L.Unlock()
		shutdownChan <- struct{}{}
	}()

	defer func() {
		if r := recover(); r != nil {
			fmt.Fprintf(os.Stderr, "Panic while pinging MongoDb: %v\n", r)
			unexpectedShutdownOnce.Do(shutdown)
		}
	}()

checkLoop:
	for {
		timer := time.NewTimer(3 * time.Second)
		select {
		case <-shutdownChan:
			timer.Stop()
			break checkLoop
		case <-timer.C:
			// Do nothing
		}

		if err := conn.session.Ping(); err != nil {
			fmt.Fprintln(os.Stderr, "MongoDbConnection shut down unexpectedly!")
			unexpectedShutdownOnce.Do(shutdown)
		}
	}
}

func shutdown() {
	fmt.Println("Shutting down!")
	ShutdownSignal.Broadcast()

	if DbConnection != nil {
		DbConnection.session.Close()
	}

	ShutdownWg.Done()
}