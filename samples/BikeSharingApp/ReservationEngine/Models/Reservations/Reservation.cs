// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace app.Models
{
    public class Reservation
    {
        [JsonProperty("reservationId")]
        public string ReservationId { get; set; }

        [JsonProperty("userId")]
        [Required]
        public string UserId { get; set; }

        [JsonProperty("bikeId")]
        [Required]
        public string BikeId { get; set; }

        [JsonProperty("state")]
        public string State {get;set;}

        [JsonProperty("requestTime")]
        public string RequestTime {get;set;}

        [JsonProperty("startTime")]
        public string StartTime {get;set;}

        [JsonProperty("endTime")]
        public string EndTime {get;set;}

        [JsonProperty("invoiceId")]
        public string InvoiceId { get; set; }

        [JsonProperty("requestId")]
        public string RequestId { get; set; }
    }
}
