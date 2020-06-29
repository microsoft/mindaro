// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using app.Models;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace app
{
    public static class BillingHelper
    {
        private static string _billingService { get; set; }

        private const string DateTimeFormat = "yyyy-MM-ddTHH:mm:ss";

        public static void Init(CustomConfiguration customConfiguration)
        {
            LogUtility.Log("BillingHelper init start");
            _billingService = Environment.GetEnvironmentVariable(Constants.BillingMicroserviceEnv) ?? customConfiguration.Services.Billing;
            LogUtility.Log("BillingHelper init end");
        }

        public static async Task<BillingResponse> CreateInvoice(Guid requestId, Reservation reservationDetails, HttpRequest originRequest)
        {
            LogUtility.LogWithContext(requestId, "Creating an invoice");
            var bikeDetails = await BikesHelper.GetBike(requestId, reservationDetails.BikeId, originRequest);
            var startTime = DateTime.ParseExact(reservationDetails.StartTime, DateTimeFormat, null);
            var endTime = DateTime.ParseExact(reservationDetails.EndTime, DateTimeFormat, null);
            double amount = 0;
            if (endTime > startTime)
            {
                var totalHours = Math.Ceiling((endTime - startTime).TotalHours);
                amount = totalHours * bikeDetails.HourlyCost;
            }

            var createInvoiceUrl = $"http://{_billingService}/api/invoice";
            var invoice = new Invoice
            {
                Amount = (float)amount,
                BikeId = reservationDetails.BikeId,
                CustomerId = reservationDetails.UserId,
                VendorId = bikeDetails.OwnerUserId,
                ReservationId = reservationDetails.ReservationId
            };

            var response = await HttpHelper.PostAsync(requestId, createInvoiceUrl, new StringContent(
                    JsonConvert.SerializeObject(invoice), Encoding.UTF8, "application/json"), originRequest);
            var result = new BillingResponse() { HttpResponse = response };
            if (response.IsSuccessStatusCode)
            {
                var obj = JObject.Parse(await response.Content.ReadAsStringAsync());
                result.InvoiceId = obj["id"].Value<string>();
            }
            return result;
        }

        public class BillingResponse
        {
            public HttpResponseMessage HttpResponse { get; set; }

            public string InvoiceId { get; set; }
        }
    }
}