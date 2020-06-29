// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using app.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [Route("api/reservationengine")]
    [ApiController]
    public class ReservationEngineController : ControllerBase
    {
        private static CustomConfiguration _customConfiguration { get; set; }

        private const string DateTimeFormat = "yyyy-MM-ddTHH:mm:ss";

        // POST api/reservationengine
        [HttpPost]
        public async Task<IActionResult> UpdateReservation([FromBody] Reservation reservationDetails)
        {
           var requestId = new Guid(reservationDetails.RequestId);
            LogUtility.LogWithContext(requestId, "Updating booking");

            try
            {
                if (reservationDetails.State.Equals(ReservationStatus.Booking.ToString(), StringComparison.OrdinalIgnoreCase))
                {
                    await _createBooking(requestId, reservationDetails, this.Request);
                }
                else if (reservationDetails.State.Equals(ReservationStatus.Completing.ToString(), StringComparison.OrdinalIgnoreCase))
                {
                    await _completeBooking(requestId, reservationDetails, this.Request);
                }

                LogUtility.LogWithContext(requestId, "End");
            }
            catch (Exception e)
            {
                LogUtility.LogError("Error processing message: " + e.ToString());
            }

            LogUtility.LogWithContext(requestId, "Updating booking succeeded");
            return new JsonResult(reservationDetails);
        }

        private static async Task _createBooking(Guid requestId, Reservation reservationDetails, HttpRequest originRequest)
        {
            LogUtility.LogWithContext(requestId, "Creating a booking");
            reservationDetails.EndTime = string.Empty;

            var createBookingResponse = await BikesHelper.ReserveBike(requestId, reservationDetails.BikeId, originRequest);
            if (!createBookingResponse.IsSuccessStatusCode)
            {
                LogUtility.LogErrorWithContext(requestId, "Error response from Bikes! ResponseCode: {0}, Content: {1}", createBookingResponse.StatusCode.ToString(), await createBookingResponse.Content.ReadAsStringAsync());
                await _failBooking(requestId, reservationDetails);
                return;
            }

            reservationDetails.State = ReservationStatus.Booked.ToString();
            var result = await MongoHelper.UpdateReservationStateAndEndTime(requestId, reservationDetails);

            if (result.ModifiedCount == 0)
            {
                LogUtility.LogErrorWithContext(requestId, "Reservation not updated! MatchedCount: {0}, ModifiedCount: {1}", result.MatchedCount.ToString(), result.ModifiedCount.ToString());
                await _failBooking(requestId, reservationDetails);
                return;
            }

            LogUtility.LogWithContext(requestId, "Create booking succeeded");
        }

        private static async Task _completeBooking(Guid requestId, Reservation reservationDetails, HttpRequest originRequest)
        {
            LogUtility.LogWithContext(requestId, "Completing a booking");
            reservationDetails.State = ReservationStatus.Completing.ToString();
            reservationDetails.EndTime = string.Empty;

            var reservationCompletingResult = await MongoHelper.UpdateReservationStateAndEndTime(requestId, reservationDetails);
            if (reservationCompletingResult.ModifiedCount == 0)
            {
                LogUtility.LogErrorWithContext(requestId, "Reservation not updated to 'Completing'! MatchedCount: {0}, ModifiedCount: {1}", reservationCompletingResult.MatchedCount.ToString(), reservationCompletingResult.ModifiedCount.ToString());
                await _failBooking(requestId, reservationDetails);
                return;
            }

            var freeBikeResponse = await BikesHelper.FreeBike(requestId, reservationDetails.BikeId, originRequest);
            if (!freeBikeResponse.IsSuccessStatusCode)
            {
                LogUtility.LogErrorWithContext(requestId, "Error response from Bikes! ResponseCode: {0}, Content: {1}", freeBikeResponse.StatusCode.ToString(), await freeBikeResponse.Content.ReadAsStringAsync());
                await _failBooking(requestId, reservationDetails);
                return;
            }

            reservationDetails.State = ReservationStatus.Completed.ToString();
            reservationDetails.EndTime = DateTime.UtcNow.ToString(DateTimeFormat);
            var createInvoiceResponse = await BillingHelper.CreateInvoice(requestId, reservationDetails, originRequest);
            if (!createInvoiceResponse.HttpResponse.IsSuccessStatusCode)
            {
                LogUtility.LogErrorWithContext(requestId, "Couldn't create invoice, rolling back!");
                // Rollback
                reservationDetails.EndTime = string.Empty;
                await BikesHelper.ReserveBike(requestId, reservationDetails.BikeId, originRequest);
                await _failBooking(requestId, reservationDetails);
                return;
            }
            reservationDetails.InvoiceId = createInvoiceResponse.InvoiceId;

            var reservationCompletedResult = await MongoHelper.UpdateReservationStateAndEndTime(requestId, reservationDetails);
            if (reservationCompletedResult.ModifiedCount == 0)
            {
                LogUtility.LogErrorWithContext(requestId, "Reservation not updated to 'Completed'! MatchedCount: {0}, ModifiedCount: {1}", reservationCompletedResult.MatchedCount.ToString(), reservationCompletedResult.ModifiedCount.ToString());
                await _failBooking(requestId, reservationDetails);
                return;
            }

            LogUtility.LogWithContext(requestId, "Complete booking succeeded");
        }

        private static async Task _failBooking(Guid requestId, Reservation reservationDetails)
        {
            LogUtility.LogErrorWithContext(requestId, "_failBooking start");
            reservationDetails.State = ReservationStatus.Failed.ToString();
            await MongoHelper.UpdateReservationStateAndEndTime(requestId, reservationDetails);
            LogUtility.LogErrorWithContext(requestId, "_failBooking end");
        }
    }
}