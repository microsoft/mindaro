// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"encoding/json"
	"errors"
)

// Invoice defines the expected data for Invoices
type Invoice struct {
	ID            string  `bson:"id" json:"id"`
	CustomerID    string  `bson:"customerId" json:"customerId"`
	VendorID      string  `bson:"vendorId" json:"vendorId"`
	BikeID        string  `bson:"bikeId" json:"bikeId"`
	ReservationID string  `bson:"reservationId" json:"reservationId"`
	Amount        float32 `bson:"amount" json:"amount"`
}

// Serialize serializes an invoice to JSON
func (inv Invoice) Serialize() (string, error) {
	val, err := json.Marshal(inv)
	if err != nil {
		return "", AddMyInfoToErr(err)
	}
	return string(val), nil
}

// Validate calls ValidateInvoice(inv) for the Invoice struct
func (inv Invoice) Validate() error {
	return ValidateInvoice(inv)
}

// ValidateInvoice checks an invoice and returns a non-nil error if any issues
func ValidateInvoice(inv Invoice) error {
	var errorSlice []string
	var zeroString string

	if inv.ID != zeroString {
		errorSlice = append(errorSlice, "Must not specify ID string")
	}
	if inv.BikeID == zeroString {
		errorSlice = append(errorSlice, "Must specify BikeID string")
	}
	if inv.CustomerID == zeroString {
		errorSlice = append(errorSlice, "Must specify CustomerID string")
	}
	if inv.ReservationID == zeroString {
		errorSlice = append(errorSlice, "Must specify ReservationID string")
	}
	if inv.VendorID == zeroString {
		errorSlice = append(errorSlice, "Must specify VendorID string")
	}

	// TODO validate that passed in userIDs/customerIDs are valid

	if len(errorSlice) > 0 {
		errorBytes, err := json.Marshal(errorSlice)
		if err != nil {
			return AddMyInfoToErr(err)
		}

		return errors.New(string(errorBytes))
	}

	return nil
}
