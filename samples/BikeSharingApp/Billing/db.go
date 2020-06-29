// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"crypto/tls"
	"fmt"
	"net"
	"sync"
	"time"

	"strings"

	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

type MongoDbConnection struct {
	Name       string
	session    *mgo.Session
	dbName     string
	invoiceDb  *mgo.Collection
	vendorDb   *mgo.Collection
	customerDb *mgo.Collection
	shutdownWg *sync.WaitGroup
	isShutdown bool
}

type invoiceDbEntity struct {
	ID      bson.ObjectId `bson:"_id" json:"_id"`
	Invoice Invoice       `bson:"invoice" json:"invoice"`
}

type vendorDbEntity struct {
	ID     bson.ObjectId `bson:"_id" json:"_id"`
	Vendor Vendor        `bson:"vendor" json:"vendor"`
}

type customerDbEntity struct {
	ID       bson.ObjectId `bson:"_id" json:"_id"`
	Customer Customer      `bson:"customer" json:"customer"`
}

const (
	InvoiceCollection  = "Invoice"
	VendorCollection   = "Vendor"
	CustomerCollection = "Customer"
)

func (dbConn *MongoDbConnection) AddInvoice(context *RequestContext, inv Invoice) (bson.ObjectId, error) {
	objectID := bson.NewObjectId()
	err := insertDb(dbConn.invoiceDb, invoiceDbEntity{objectID, inv})
	if err != nil {
		err = fmt.Errorf("Inserting Invoice: %v", err)
	}
	return objectID, err
}

func getInvoicesWithQuery(dbConn *MongoDbConnection, context *RequestContext, query bson.M) ([]Invoice, error) {
	var userInvoiceEntities []invoiceDbEntity
	err := findQueryDb(dbConn.invoiceDb, query, &userInvoiceEntities)
	if err != nil {
		return nil, fmt.Errorf("Querying for user invoices: %v", err)
	}
	if userInvoiceEntities == nil {
		return nil, nil
	}

	userInvoices := make([]Invoice, len(userInvoiceEntities))
	for i, entity := range userInvoiceEntities {
		entity.Invoice.ID = entity.ID.Hex()
		userInvoices[i] = entity.Invoice
	}
	return userInvoices, nil
}

func (dbConn *MongoDbConnection) GetCustomerInvoices(context *RequestContext, userID string) ([]Invoice, error) {
	invoices, err := getInvoicesWithQuery(dbConn, context, bson.M{"invoice.customerId": userID})
	return invoices, err
}

func (dbConn *MongoDbConnection) GetVendorInvoices(context *RequestContext, userID string) ([]Invoice, error) {
	invoices, err := getInvoicesWithQuery(dbConn, context, bson.M{"invoice.vendorId": userID})
	return invoices, err
}

func (dbConn *MongoDbConnection) GetInvoiceById(context *RequestContext, ID string) (Invoice, bool, error) {
	var invEntity invoiceDbEntity
	err := findByIDDb(dbConn.invoiceDb, ID, &invEntity)
	if err != nil {
		switch err {
		case mgo.ErrNotFound:
			return Invoice{}, false, nil
		default:
			return Invoice{}, false, fmt.Errorf("Getting Invoice by ID: %v", err)
		}
	}

	invEntity.Invoice.ID = invEntity.ID.Hex()
	return invEntity.Invoice, true, nil
}

func (dbConn *MongoDbConnection) GetInvoiceForReservationId(context *RequestContext, reservationId string) (Invoice, bool, error) {
	invoices, err := getInvoicesWithQuery(dbConn, context, bson.M{"invoice.reservationId": reservationId})
	if err != nil {
		return Invoice{}, false, err
	}
	if len(invoices) == 0 {
		return Invoice{}, false, nil
	}

	return invoices[0], true, err
}

func (dbConn *MongoDbConnection) AddVendor(context *RequestContext, ven Vendor) (bson.ObjectId, error) {
	objectID := bson.NewObjectId()
	err := insertDb(dbConn.vendorDb, vendorDbEntity{objectID, ven})
	if err != nil {
		err = fmt.Errorf("Inserting Vendor: %v", err)
	}
	return objectID, err
}

func (dbConn *MongoDbConnection) UpdateVendorByUserId(context *RequestContext, ven Vendor) error {
	entity := vendorDbEntity{Vendor: ven}
	if err := updateDb(dbConn.vendorDb, bson.M{"vendor.userId": ven.UserID}, entity); err != nil {
		return fmt.Errorf("Updating Vendor: %v", err)
	}
	return nil
}

func (dbConn *MongoDbConnection) GetVendorByUserId(context *RequestContext, userID string) (Vendor, bool, error) {
	var venEntity []vendorDbEntity
	err := findQueryDb(dbConn.vendorDb, bson.M{"vendor.userId": userID}, &venEntity)
	if err != nil {
		return Vendor{}, false, fmt.Errorf("Getting Vendor by ID: %v", err)
	}
	if venEntity == nil {
		// Vendor not found
		return Vendor{}, false, nil
	}

	if len(venEntity) > 1 {
		LogErrFormatWithContext(context, "Found %d vendors in DB with UserID '%s'", len(venEntity), userID)
	}

	venEntity[0].Vendor.ID = venEntity[0].ID.Hex()
	return venEntity[0].Vendor, true, nil
}

func (dbConn *MongoDbConnection) AddCustomer(context *RequestContext, cust Customer) (bson.ObjectId, error) {
	objectID := bson.NewObjectId()
	err := insertDb(dbConn.customerDb, customerDbEntity{objectID, cust})
	if err != nil {
		err = fmt.Errorf("Inserting Customer: %v", err)
	}
	return objectID, err
}

func (dbConn *MongoDbConnection) UpdateCustomerByUserId(context *RequestContext, cust Customer) error {
	entity := customerDbEntity{Customer: cust}
	if err := updateDb(dbConn.customerDb, bson.M{"customer.userId": cust.UserID}, entity); err != nil {
		return fmt.Errorf("Updating Customer: %v", err)
	}
	return nil
}

func (dbConn *MongoDbConnection) GetCustomerByUserId(context *RequestContext, userID string) (Customer, bool, error) {
	var custEntity []customerDbEntity
	err := findQueryDb(dbConn.customerDb, bson.M{"customer.userId": userID}, &custEntity)
	if err != nil {
		return Customer{}, false, fmt.Errorf("Getting Customer by ID: %v", err)
	}
	if custEntity == nil {
		// Customer not found
		return Customer{}, false, nil
	}

	if len(custEntity) > 1 {
		LogErrFormatWithContext(context, "Found %d customers in DB with UserID '%s'", len(custEntity), userID)
	}

	custEntity[0].Customer.ID = custEntity[0].ID.Hex()
	return custEntity[0].Customer, true, nil
}

func (dbConn *MongoDbConnection) Ping() error {
	return dbConn.session.Ping()
}

func (dbConn *MongoDbConnection) Shutdown() {
	if !dbConn.isShutdown {
		dbConn.session.Close()
		dbConn.log("MongoDb connection closed")
		dbConn.shutdownWg.Done()
		dbConn.isShutdown = true
	} else {
		LogErrFormat("Multiple Shutdown() called for '%s'", dbConn.Name)
	}
}

func (dbConn *MongoDbConnection) log(format string, args ...interface{}) {
	logMessageTo(stdLogger, fmt.Sprintf("DB '%s': %s", dbConn.Name, format), args...)
}

func (dbConn *MongoDbConnection) logerr(format string, args ...interface{}) {
	logMessageTo(errLogger, fmt.Sprintf("DB '%s': %s", dbConn.Name, format), args...)
}

func NewDbConnection(connectionName, connectionString, dbName string, shutdownWg *sync.WaitGroup) (*MongoDbConnection, error) {
	dbConn := &MongoDbConnection{
		Name:       connectionName,
		dbName:     dbName,
		shutdownWg: shutdownWg,
		isShutdown: false,
	}

	editedConnectionString := strings.Replace(connectionString, "ssl=true", "", -1) // 'ssl=true' not supported by mgo
	info, err := mgo.ParseURL(editedConnectionString)
	if err != nil {
		return nil, fmt.Errorf("Couldn't parse mongo connection string: %v", err)
	}

	if connectionString != editedConnectionString {
		// Define override DialServer func that connects via SSL
		info.DialServer = func(addr *mgo.ServerAddr) (net.Conn, error) {
			conn, err := tls.Dial("tcp", addr.String(), nil)
			if err != nil {
				err = AddMyInfoToErr(fmt.Errorf("Couldn't dial secure TCP connection to database: %v", err))
			}
			return conn, err
		}
	}

	dbConn.log("Dialing MongoDb (%q)", info.Addrs)
	maxTries := 5
	for i := 1; i <= maxTries; i++ {
		dbConn.session, err = mgo.DialWithInfo(info)
		if err == nil {
			break
		}

		if i < maxTries {
			dbConn.logerr("%d/%d - Couldn't connect, sleeping and trying again", i, maxTries)
			time.Sleep(1 * time.Second)
		} else {
			dbConn.logerr("%d/%d - Couldn't connect.", i, maxTries)
		}
	}
	if err != nil {
		return nil, fmt.Errorf("Failed to dial db (%s): %v", connectionString, err)
	}
	dbConn.log("Got MongoDb connection")

	dbConn.invoiceDb = dbConn.session.DB(dbName).C(InvoiceCollection)
	dbConn.vendorDb = dbConn.session.DB(dbName).C(VendorCollection)
	dbConn.customerDb = dbConn.session.DB(dbName).C(CustomerCollection)

	dbConn.shutdownWg.Add(1)
	return dbConn, nil
}

func updateDb(db *mgo.Collection, selector bson.M, entity interface{}) error {
	if err := db.Update(selector, entity); err != nil {
		return err
	}

	return nil
}

func insertDb(db *mgo.Collection, entity interface{}) error {
	if err := db.Insert(entity); err != nil {
		return err
	}

	return nil
}

func findQueryDb(db *mgo.Collection, query bson.M, result interface{}) error {
	err := db.Find(query).All(result) // NOTE: may cause out of memory
	if err != nil {
		return err
	}

	return nil
}

func findByIDDb(db *mgo.Collection, ID string, result interface{}) error {
	if !bson.IsObjectIdHex(ID) {
		return fmt.Errorf("'%s' is not a valid Mongo ObjectId", ID)
	}
	err := db.FindId(bson.ObjectIdHex(ID)).One(result)
	if err != nil {
		return err
	}

	return nil
}
