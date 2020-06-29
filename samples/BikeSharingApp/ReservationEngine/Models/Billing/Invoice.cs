// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Newtonsoft.Json;

namespace app.Models
{
    class Invoice
    {
        [JsonProperty("reservationId")]
        public string ReservationId { get; set; }

        [JsonProperty("bikeId")]
        public string BikeId { get; set; }

        [JsonProperty("customerId")]
        public string CustomerId { get; set; }

        [JsonProperty("vendorId")]
        public string VendorId { get; set; }

        [JsonProperty("amount")]
        public float Amount { get; set; }
    }
}
