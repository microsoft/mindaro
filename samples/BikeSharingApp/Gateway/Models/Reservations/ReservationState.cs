// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace app.Models.Reservations
{
    public enum ReservationState
    {
        Booking = 1,
        Completing = 2,
        Booked = 3,
        Completed = 4,
        Failed = 5
    }
}
