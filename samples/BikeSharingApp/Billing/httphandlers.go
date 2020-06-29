// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gopkg.in/mgo.v2/bson"

	"github.com/gorilla/mux"

	uuid "github.com/nu7hatch/gouuid"
)

type handlerResult struct {
	Message      string
	ResponseCode int
	Error        error
}

type helloResponse struct {
	Status string
}

type RequestContext struct {
	RequestID *uuid.UUID
}

const (
	RequestIDHeaderName = "x-contoso-request-id"
)

type EndpointHandler func(req *http.Request, context *RequestContext) *handlerResult

type EndpointHandlerNoContext func(req *http.Request, context *RequestContext) *handlerResult

func (handler EndpointHandler) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	serveHTTPInner(handler, rw, req, true)
}

func (handler EndpointHandlerNoContext) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	serveHTTPInner(EndpointHandler(handler), rw, req, false)
}

func serveHTTPInner(handler EndpointHandler, rw http.ResponseWriter, req *http.Request, requireContext bool) {
	startTime := time.Now()
	result := &handlerResult{}

	requestContext, err := getRequestContext(req)
	if !requireContext && err != nil {
		requestContext = &RequestContext{&uuid.UUID{}}
		err = nil
	}
	if err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
	} else if result = handler(req, requestContext); result == nil || (result.ResponseCode == 0 && result.Error == nil) {
		panic("Handler returned bad handlerResult!")
	}

	defer func() { logRequestEnd(req.Method, req.URL.Path, startTime, result.ResponseCode, requestContext) }()

	if result.Error != nil {
		result.ResponseCode = http.StatusInternalServerError
		result.Message = result.Error.Error()
		LogErrFormatWithContext(requestContext, "Returning 500 error: %s", result.Message)
	}

	rw.WriteHeader(result.ResponseCode)

	if result.Message != "" {
		if _, err := fmt.Fprintf(rw, "%s\n", result.Message); err != nil {
			result.ResponseCode = http.StatusInternalServerError
			rw.WriteHeader(http.StatusInternalServerError)
			LogErrorWithContext(requestContext, AddMyInfoToErr(err))
			LogErrFormatWithContext(requestContext, "Message: %v", result.Message)
		}
	}
}

func logRequestEnd(httpMethod string, endpoint string, startTime time.Time, responseCode int, requestContext *RequestContext) {
	requestID := "nil"
	if requestContext != nil {
		requestID = requestContext.RequestID.String()
	}

	milliseconds := float64(time.Since(startTime).Nanoseconds()) / float64(time.Millisecond)
	Log("%s %s - %.2fms %d - %s", httpMethod, endpoint, milliseconds, responseCode, requestID)
}

func getRequestContext(req *http.Request) (*RequestContext, error) {
	reqID := req.Header.Get(RequestIDHeaderName)
	reqUUID, err := uuid.ParseHex(reqID)
	if err != nil {
		return nil, fmt.Errorf("Couldn't parse %s header: %v", RequestIDHeaderName, err)
	}
	return &RequestContext{reqUUID}, nil
}

// HelloHandler handles the /hello endpoint
func HelloHandler(req *http.Request, context *RequestContext) *handlerResult {
	data := helloResponse{Status: "Hello!"}
	encodedData, err := json.Marshal(data)
	if err != nil {
		return &handlerResult{Error: AddMyInfoToErr(err)}
	}

	return &handlerResult{ResponseCode: http.StatusOK, Message: string(encodedData)}
}

func checkInvoicesForUser(req *http.Request, context *RequestContext, userID string, invoices []Invoice, result *handlerResult) {
	if invoices == nil {
		result.ResponseCode = http.StatusNotFound
		result.Message = fmt.Sprintf("Could not find any invoices for vendor ID: (%s)", userID)
		return
	}

	invoicesBytes, err := json.Marshal(invoices)
	if err != nil {
		result.Error = AddMyInfoToErr(err)
		return
	}

	result.Message = string(invoicesBytes)
	result.ResponseCode = http.StatusOK
}

func GetInvoicesForVendorHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	vars := mux.Vars(req)
	userID := vars["userID"]
	invoices, err := DbConnection.GetVendorInvoices(context, userID)
	if err != nil {
		result.Error = err
		return
	}
	checkInvoicesForUser(req, context, userID, invoices, result)
	return
}

func GetInvoicesForCustomerHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	vars := mux.Vars(req)
	userID := vars["userID"]
	invoices, err := DbConnection.GetCustomerInvoices(context, userID)
	if err != nil {
		result.Error = err
		return
	}
	checkInvoicesForUser(req, context, userID, invoices, result)
	return
}

func GetInvoiceHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	vars := mux.Vars(req)
	invoiceID := vars["id"]
	if !bson.IsObjectIdHex(invoiceID) {
		result.ResponseCode = http.StatusBadRequest
		result.Message = fmt.Sprintf("(%s) is not a valid invoiceID", invoiceID)
		return
	}
	invoice, ok, err := DbConnection.GetInvoiceById(context, invoiceID)
	if err != nil {
		result.Error = err
		return
	}
	if !ok {
		result.ResponseCode = http.StatusNotFound
		result.Message = fmt.Sprintf("Could not find invoice with ID: (%s)", invoiceID)
		return
	}

	result.Message, err = invoice.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

func GetInvoiceForReservationIdHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	vars := mux.Vars(req)
	reservationID := vars["resID"]
	invoice, ok, err := DbConnection.GetInvoiceForReservationId(context, reservationID)
	if err != nil {
		result.Error = err
		return
	}
	if !ok {
		result.ResponseCode = http.StatusNotFound
		result.Message = fmt.Sprintf("Could not find an invoice for reservation ID: (%s)", reservationID)
		return
	}

	result.Message, err = invoice.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

func GetVendorByUserIdHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	vars := mux.Vars(req)
	userID := vars["userID"]
	vendor, ok, err := DbConnection.GetVendorByUserId(context, userID)
	if err != nil {
		result.Error = err
		return
	}
	if !ok {
		result.ResponseCode = http.StatusNotFound
		result.Message = fmt.Sprintf("Could not find vendor with UserID: (%s)", userID)
		return
	}

	result.Message, err = vendor.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

func GetCustomerByUserIdHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	vars := mux.Vars(req)
	userID := vars["userID"]
	customer, ok, err := DbConnection.GetCustomerByUserId(context, userID)
	if err != nil {
		result.Error = err
		return
	}
	if !ok {
		result.ResponseCode = http.StatusNotFound
		result.Message = fmt.Sprintf("Could not find customer with UserID: (%s)", userID)
		return
	}

	result.Message, err = customer.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

// NewInvoiceHandler handles the /invoice endpoint
func NewInvoiceHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	decoder := json.NewDecoder(req.Body)
	inv := Invoice{}
	// Deserialize Invoice
	if err := decoder.Decode(&inv); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}
	if err := inv.Validate(); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}

	// Add the invoice
	LogWithContext(context, "Adding invoice for reservation (%s)", inv.ReservationID)
	dbID, err := DbConnection.AddInvoice(context, inv)
	if err != nil {
		result.Error = err
		return
	}
	inv.ID = dbID.Hex()

	LogWithContext(context, "Added invoice to db (dbID: %s), processing payment", inv.ID)
	/*
	 * Process invoice payment here
	 */
	LogWithContext(context, "Payment processing done")
	LogWithContext(context, "Invoice complete for reservation (%s)", inv.ReservationID)

	result.Message, err = inv.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

func NewVendorHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	decoder := json.NewDecoder(req.Body)
	ven := Vendor{}
	// Deserialize Vendor
	if err := decoder.Decode(&ven); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}
	if err := ven.Validate(); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}

	// Add the vendor
	LogWithContext(context, "Adding new vendor")
	dbID, err := DbConnection.AddVendor(context, ven)
	if err != nil {
		result.Error = err
		return
	}
	LogWithContext(context, "Added new vendor (dbID: %s)", dbID.Hex())
	ven.ID = dbID.Hex()

	result.Message, err = ven.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

func UpdateVendorHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	decoder := json.NewDecoder(req.Body)
	ven := Vendor{}
	// Deserialize Vendor
	if err := decoder.Decode(&ven); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}
	if err := ven.Validate(); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}

	// Update the vendor
	LogWithContext(context, "Updating vendor")
	err := DbConnection.UpdateVendorByUserId(context, ven)
	if err != nil {
		result.Error = err
		return
	}
	LogWithContext(context, "Updated vendor (userID: %s)", ven.UserID)

	var ok bool
	ven, ok, err = DbConnection.GetVendorByUserId(context, ven.UserID)
	if err != nil {
		result.Error = err
		return
	}
	if !ok {
		result.Error = fmt.Errorf("Couldn't get the updated Vendor")
		return
	}

	result.Message, err = ven.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

func NewCustomerHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	decoder := json.NewDecoder(req.Body)
	cust := Customer{}
	// Deserialize Customer
	if err := decoder.Decode(&cust); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
	}
	if err := cust.Validate(); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}

	// Add the Customer
	LogWithContext(context, "Adding new customer")
	dbID, err := DbConnection.AddCustomer(context, cust)
	if err != nil {
		result.Error = err
		return
	}
	LogWithContext(context, "Added new customer (dbID: %s)", dbID.Hex())
	cust.ID = dbID.Hex()

	result.Message, err = cust.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}

func UpdateCustomerHandler(req *http.Request, context *RequestContext) (result *handlerResult) {
	result = &handlerResult{}

	decoder := json.NewDecoder(req.Body)
	cust := Customer{}
	// Deserialize Customer
	if err := decoder.Decode(&cust); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}
	if err := cust.Validate(); err != nil {
		result.ResponseCode = http.StatusBadRequest
		result.Message = err.Error()
		return
	}

	// Update the customer
	LogWithContext(context, "Updating customer")
	err := DbConnection.UpdateCustomerByUserId(context, cust)
	if err != nil {
		result.Error = err
		return
	}
	LogWithContext(context, "Updated customer (userID: %s)", cust.UserID)

	var ok bool
	cust, ok, err = DbConnection.GetCustomerByUserId(context, cust.UserID)
	if err != nil {
		result.Error = err
		return
	}
	if !ok {
		result.Error = fmt.Errorf("Couldn't get the updated Customer")
		return
	}

	result.Message, err = cust.Serialize()
	if err != nil {
		result.Error = err
	} else {
		result.ResponseCode = http.StatusOK
	}
	return
}
