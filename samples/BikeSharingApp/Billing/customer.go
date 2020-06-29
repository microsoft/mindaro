// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"encoding/json"
	"errors"
)

type Customer struct {
	ID       string `bson:"id" json:"id"`
	UserID   string `bson:"userId" json:"userId"`
	CCNumber string `bson:"ccNumber" json:"ccNumber"`
	CCExpiry string `bson:"ccExpiry" json:"ccExpiry"`
	CCCCV    string `bson:"ccCCV" json:"ccCCV"`
}

// Serialize serializes a customer to JSON
func (cust Customer) Serialize() (string, error) {
	val, err := json.Marshal(cust)
	if err != nil {
		return "", AddMyInfoToErr(err)
	}
	return string(val), nil
}

func (cust Customer) Validate() error {
	return ValidateCustomer(cust)
}

func ValidateCustomer(cust Customer) error {
	var errorSlice []string
	var zeroString string

	if cust.ID != zeroString {
		errorSlice = append(errorSlice, "Must not specify ID string")
	}
	if cust.UserID == zeroString {
		errorSlice = append(errorSlice, "Must specify UserID string")
	}
	if cust.CCNumber == zeroString {
		errorSlice = append(errorSlice, "Must specify CCNumber string")
	}
	if cust.CCExpiry == zeroString {
		errorSlice = append(errorSlice, "Must specify CCExpiry string")
	}
	if cust.CCCCV == zeroString {
		errorSlice = append(errorSlice, "Must specify CCCCV string")
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
