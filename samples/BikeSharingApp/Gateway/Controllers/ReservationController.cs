// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using app.Models;
using app.Models.Reservations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace app.Controllers
{
    [Route("api/reservation")]
    public class ReservationController : Controller
    {
        private CustomConfiguration _customConfiguration { get; set; }

        private string _reservationsService { get; set; }

        private string _reservationEngineService { get; set; }

        private string _billingService { get; set; }

        private string _bikesService { get; set; }

        private string _usersService { get; set; }

        private const string DateTimeFormat = "yyyy-MM-ddTHH:mm:ss";

        public ReservationController(IOptions<CustomConfiguration> customConfiguration)
        {
            _customConfiguration = customConfiguration.Value;
            _reservationsService = Environment.GetEnvironmentVariable(Constants.ReservationsMicroserviceEnv) ?? _customConfiguration.Services.Reservations;
            _reservationEngineService = Environment.GetEnvironmentVariable(Constants.ReservationEngineMicroserviceEnv) ?? _customConfiguration.Services.ReservationEngine;
            _billingService = Environment.GetEnvironmentVariable(Constants.BillingMicroserviceEnv) ?? _customConfiguration.Services.Billing;
            _bikesService = Environment.GetEnvironmentVariable(Constants.BikesMicroserviceEnv) ?? _customConfiguration.Services.Bikes;
            _usersService = Environment.GetEnvironmentVariable(Constants.UsersMicroserviceEnv) ?? _customConfiguration.Services.Users;
        }

        // POST: api/reservationengine
        private async Task<IActionResult> _UpdateReservation(Reservation reservationDetails)
        {
            string updateReservationUrl = $"http://{_reservationEngineService}/api/reservationengine";
            var response = await HttpHelper.PostAsync(updateReservationUrl, new StringContent(
                JsonConvert.SerializeObject(reservationDetails), Encoding.UTF8, "application/json"), this.Request);
            if (response.IsSuccessStatusCode)
            {
                return new JsonResult(reservationDetails);
            }
            return await HttpHelper.ReturnResponseResult(response);
        }

        /// <summary>
        /// Returns null on success
        /// </summary>
        /// <param name="res"></param>
        /// <returns></returns>
        internal static async Task<IActionResult> _AddInvoiceDetailsToReservation(string billingServiceUri, HttpRequest originRequest, Reservation res)
        {
            string getInvoiceForResUrl = $"http://{billingServiceUri}/api/reservation/{res.ReservationId}/invoice";
            var response = await HttpHelper.GetAsync(getInvoiceForResUrl, originRequest);
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode != HttpStatusCode.NotFound)
                {
                    return await HttpHelper.ReturnResponseResult(response);
                }

                // Not found - Valid case
                res.InvoiceId = string.Empty;
                return null; // success
            }

            var invoice = JsonConvert.DeserializeObject<Invoice>(await response.Content.ReadAsStringAsync());
            if (invoice == null)
            {
                return HttpHelper.Return500Result("Unexpected object returned when getting invoice for reservation id");
            }

            res.InvoiceId = invoice.Id;
            return null; // success
        }

        // GET: api/reservation/1
        // TODO: add this after reservation microservice is ready.
        [HttpGet("{reservationId}")]
        public async Task<IActionResult> GetReservation(string reservationId)
        {
            string getReservationUrl = $"http://{_reservationsService}/api/reservation/{reservationId}";
            var response = await HttpHelper.GetAsync(getReservationUrl, this.Request);
            if (!response.IsSuccessStatusCode)
            {
                return await HttpHelper.ReturnResponseResult(response);
            }

            var reservationDetails = JsonConvert.DeserializeObject<Reservation>(await response.Content.ReadAsStringAsync());
            var addInvoiceDetailsResponse = await _AddInvoiceDetailsToReservation(_billingService, this.Request, reservationDetails);
            if (addInvoiceDetailsResponse != null)
            {
                return addInvoiceDetailsResponse;
            }
            return new JsonResult(reservationDetails);
        }

        // GET: api/reservation/allReservations
        [HttpGet("allReservations")]
        public async Task<IActionResult> GetAllReservations()
        {
            string getAllReservationsUrl = $"http://{_reservationsService}/api/allReservations";
            var response = await HttpHelper.GetAsync(getAllReservationsUrl, this.Request);
            if (!response.IsSuccessStatusCode)
            {
                return await HttpHelper.ReturnResponseResult(response);
            }

            var allReservations = JsonConvert.DeserializeObject<Reservation[]>(await response.Content.ReadAsStringAsync()) ?? new Reservation[0];
            foreach (var res in allReservations)
            {
                var addInvoiceDetailsResponse = await _AddInvoiceDetailsToReservation(_billingService, this.Request, res);
                if (addInvoiceDetailsResponse != null)
                {
                    return addInvoiceDetailsResponse;
                }
            }
            return Json(allReservations);
        }

        private async Task<IActionResult> _CreateNewReservationAsync(Reservation reservationDetails)
        {
            string addReservationUrl = $"http://{_reservationsService}/api/reservation";
            var response = await HttpHelper.PostAsync(addReservationUrl, new StringContent(
                JsonConvert.SerializeObject(reservationDetails), Encoding.UTF8, "application/json"), this.Request);
            if (response.IsSuccessStatusCode)
            {
                return new JsonResult(reservationDetails);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }

        // POST: /api/reservation
        [HttpPost]
        public async Task<IActionResult> CreateReservation([FromBody] Reservation reservationDetails)
        {
            if (!ModelState.IsValid)
            {
                return new ContentResult
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Content = JsonConvert.SerializeObject(ModelState.Values.SelectMany(v => v.Errors))
                };
            }

            try
            {
                // Check valid bike
                string getBikeUrl = $"http://{_bikesService}/api/bikes/{reservationDetails.BikeId}";
                var getBikeResponse = await HttpHelper.GetAsync(getBikeUrl, this.Request);
                if (!getBikeResponse.IsSuccessStatusCode)
                {
                    return await HttpHelper.ReturnResponseResult(getBikeResponse);
                }

                var bike = JsonConvert.DeserializeObject<Bike>(await getBikeResponse.Content.ReadAsStringAsync());
                if (bike == null)
                {
                    return new ContentResult()
                    {
                        StatusCode = (int)HttpStatusCode.InternalServerError,
                        Content = "Unexpected type returned from call to get bike"
                    };
                }
                if (!bike.Available.Equals("true", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(StatusCodes.Status400BadRequest, $"BikeId '{reservationDetails.BikeId}' is not available");
                }

                // Check valid customer
                string getUserUrl = $"http://{_usersService}/api/users/{reservationDetails.UserId}";
                var getUserResponse = await HttpHelper.GetAsync(getUserUrl, this.Request);
                if (!getUserResponse.IsSuccessStatusCode)
                {
                    return await HttpHelper.ReturnResponseResult(getUserResponse);
                }

                var user = JsonConvert.DeserializeObject<UserResponse>(await getUserResponse.Content.ReadAsStringAsync());
                if (user == null)
                {
                    return new ContentResult()
                    {
                        StatusCode = (int)HttpStatusCode.InternalServerError,
                        Content = "Unexpected type returned from call to get customer"
                    };
                }
                if (user.Type != UserType.Customer)
                {
                    return BadRequest("UserId must be a customer");
                }

                reservationDetails.ReservationId = Guid.NewGuid().ToString("N");
                reservationDetails.RequestTime = DateTime.UtcNow.ToString(DateTimeFormat);
                reservationDetails.StartTime = string.IsNullOrEmpty(reservationDetails.StartTime) ? DateTime.UtcNow.ToString(DateTimeFormat) : reservationDetails.StartTime;
                reservationDetails.State = ReservationState.Booking.ToString();
                reservationDetails.EndTime = string.Empty;
                reservationDetails.RequestId = OperationContext.CurrentContext.RequestId.ToString();

                // Create new entry in reservation db and add job to queue for engine to process
                var resResponse = await _CreateNewReservationAsync(reservationDetails);
                if ((resResponse as JsonResult) == null)
                {
                    return resResponse;
                }

                // Update reservation by sending to reservation engine. Should we replace this with a queue?
                var updatedResponse = await _UpdateReservation(reservationDetails);
                if ((updatedResponse as JsonResult) == null)
                {
                    return updatedResponse;
                }
            }
            catch (Exception e)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, e.ToString());
            }

            return new JsonResult(reservationDetails);
        }

        // POST: /api/reservation/1
        [HttpPost("{reservationId}")]
        public async Task<IActionResult> CompleteReservation(string reservationId)
        {
            try
            {
                string getReservationUrl = $"http://{_reservationsService}/api/reservation/{reservationId}";
                var response = await HttpHelper.GetAsync(getReservationUrl, this.Request);
                if (response.IsSuccessStatusCode)
                {
                    var reservationDetails = JsonConvert.DeserializeObject<Reservation>(await response.Content.ReadAsStringAsync());
                    reservationDetails.State = ReservationState.Completing.ToString();

                    // Update reservation by sending to reservation engine. Should we replace this with a queue?
                    var updatedResponse = await _UpdateReservation(reservationDetails);
                    if ((updatedResponse as JsonResult) == null)
                    {
                        return updatedResponse;
                    }

                    return new JsonResult(reservationDetails);
                }

                return await HttpHelper.ReturnResponseResult(response);
            }
            catch (Exception e)
            {
                return StatusCode(Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError, e.ToString());
            }
        }
    }
}