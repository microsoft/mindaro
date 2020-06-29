// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"encoding/json"
	"errors"
)

type Vendor struct {
	ID            string `bson:"id" json:"id"`
	UserID        string `bson:"userId" json:"userId"`
	RoutingNumber string `bson:"routingNumber" json:"routingNumber"`
	AccountNumber string `bson:"accountNumber" json:"accountNumber"`
}

// Serialize serializes a vendor to JSON
func (ven Vendor) Serialize() (string, error) {
	val, err := json.Marshal(ven)
	if err != nil {
		return "", AddMyInfoToErr(err)
	}
	return string(val), nil
}

// Validate calls ValidateVendor(ven) for the Vendor struct
func (ven Vendor) Validate() error {
	return ValidateVendor(ven)
}

func ValidateVendor(ven Vendor) error {
	var errorSlice []string
	var zeroString string

	if ven.UserID == zeroString {
		errorSlice = append(errorSlice, "Must specify UserID string")
	}
	if ven.AccountNumber == zeroString {
		errorSlice = append(errorSlice, "Must specify AccountNumber string")
	}
	if ven.RoutingNumber == zeroString {
		errorSlice = append(errorSlice, "Must specify RoutingNumber string")
	}

	if len(errorSlice) > 0 {
		errorBytes, err := json.Marshal(errorSlice)
		if err != nil {
			return AddMyInfoToErr(err)
		}

		return errors.New(string(errorBytes))
	}

	return nil
}
