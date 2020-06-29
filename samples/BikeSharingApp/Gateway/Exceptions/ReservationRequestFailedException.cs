// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using app.Models;
using app.Models.Reservations;

namespace app.Exceptions
{
    public class ReservationRequestFailedException : Exception
    {
        public ReservationRequestFailedException(Reservation reservationDetails, ReservationState expectedState)
            : base($"Reservation request failed for reservationID '{reservationDetails.ReservationId}'. Expected state: '{expectedState.ToString()}'. Actual state: '{reservationDetails.State}'")
        {}
    }
}
