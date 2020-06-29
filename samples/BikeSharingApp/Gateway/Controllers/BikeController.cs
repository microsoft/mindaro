// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace app.Controllers
{
    [Route("api/bike")]
    public class BikeController : Controller
    {
        private string _bikesService { get; set; }

        private string _usersService { get; set; }

        private CustomConfiguration _customConfiguration { get; set; }

        public BikeController(IOptions<CustomConfiguration> customConfiguration)
        {
            _customConfiguration = customConfiguration.Value;
            _bikesService = Environment.GetEnvironmentVariable(Constants.BikesMicroserviceEnv) ?? _customConfiguration.Services.Bikes;
            _usersService = Environment.GetEnvironmentVariable(Constants.UsersMicroserviceEnv) ?? _customConfiguration.Services.Users;
        }

        // GET: api/bike/1
        [HttpGet("{bikeId}")]
        public async Task<IActionResult> GetBike(string bikeId)
        {
            string getBikeUrl = $"http://{_bikesService}/api/bikes/{bikeId}";
            var response = await HttpHelper.GetAsync(getBikeUrl, this.Request);
            if (response.IsSuccessStatusCode)
            {
                var bikeDetails = JsonConvert.DeserializeObject<Bike>(await response.Content.ReadAsStringAsync());
                return new JsonResult(bikeDetails);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }

        // PATCH: /api/bike/1
        [HttpPatch("{bikeId}")]
        public async Task<IActionResult> UpdateBike(string bikeId, [FromBody] AddUpdateBikeRequest newBikeDetails)
        {
            // Ensure ownerUserId for bike is valid
            var checkOwnerResponse = await this._CheckOwnerUserIdIsValidVendor(newBikeDetails.OwnerUserId);
            if (checkOwnerResponse != null)
            {
                return checkOwnerResponse;
            }

            string getUpdateBikeUrl = $"http://{_bikesService}/api/bikes/{bikeId}";
            var getResponse = await HttpHelper.GetAsync(getUpdateBikeUrl, this.Request);
            if (getResponse.IsSuccessStatusCode)
            {
                var existingBikeDetails = JsonConvert.DeserializeObject<Bike>(await getResponse.Content.ReadAsStringAsync());
                var updatedBikeDetails = new AddUpdateBikeRequest
                {
                    Model = string.IsNullOrEmpty(newBikeDetails.Model) ? existingBikeDetails.Model : newBikeDetails.Model,
                    HourlyCost = newBikeDetails.HourlyCost ?? existingBikeDetails.HourlyCost,
                    ImageUrl = newBikeDetails.ImageUrl ?? existingBikeDetails.ImageUrl,
                    Type = string.IsNullOrEmpty(newBikeDetails.Type) ? existingBikeDetails.Type : newBikeDetails.Type,
                    SuitableHeightInMeters = newBikeDetails.SuitableHeightInMeters ?? existingBikeDetails.SuitableHeightInMeters,
                    MaximumWeightInKg = newBikeDetails.MaximumWeightInKg ?? existingBikeDetails.MaximumWeightInKg,
                    OwnerUserId = existingBikeDetails.OwnerUserId
                };

                var updateResponse = await HttpHelper.PutAsync(getUpdateBikeUrl, new StringContent(
                    JsonConvert.SerializeObject(updatedBikeDetails), Encoding.UTF8, "application/json"), this.Request);
                if (updateResponse.IsSuccessStatusCode)
                {
                    return await GetBike(bikeId);
                }

                return await HttpHelper.ReturnResponseResult(updateResponse);
            }

            return await HttpHelper.ReturnResponseResult(getResponse);
        }

        // DELETE: /api/bike/1
        [HttpDelete("{bikeId}")]
        public async Task<IActionResult> DeleteBike(string bikeId)
        {
            string getDeleteBikeUrl = $"http://{_bikesService}/api/bikes/{bikeId}";
            var getResponse = await HttpHelper.GetAsync(getDeleteBikeUrl, this.Request);
            if (getResponse.IsSuccessStatusCode)
            {
                // Bike exists, proceed with deletion.
                var deleteResponse = await HttpHelper.DeleteAsync(getDeleteBikeUrl, this.Request);
                return await HttpHelper.ReturnResponseResult(deleteResponse);
            }

            return await HttpHelper.ReturnResponseResult(getResponse);
        }

        /// <summary>
        /// Returns null on success
        /// </summary>
        /// <param name="ownerUserId"></param>
        /// <returns></returns>
        private async Task<IActionResult> _CheckOwnerUserIdIsValidVendor(string ownerUserId)
        {
            string getUserUrl = $"http://{_usersService}/api/users/{ownerUserId}";
            var getUserResponse = await HttpHelper.GetAsync(getUserUrl, this.Request);
            if (!getUserResponse.IsSuccessStatusCode)
            {
                return await HttpHelper.ReturnResponseResult(getUserResponse);
            }

            UserResponse user = JsonConvert.DeserializeObject<UserResponse>(await getUserResponse.Content.ReadAsStringAsync());
            if (user == null)
            {
                return new ContentResult()
                {
                    StatusCode = (int)HttpStatusCode.InternalServerError,
                    Content = $"Unexpected object returned while checking owner user"
                };
            }
            if (user.Type != UserType.Vendor)
            {
                return BadRequest("Owner user type must be Vendor");
            }

            return null;
        }

        // POST: /api/bike
        [HttpPost]
        public async Task<IActionResult> AddBike([FromBody] AddUpdateBikeRequest newBikeDetails)
        {
            if (!ModelState.IsValid)
            {
                return new ContentResult
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Content = JsonConvert.SerializeObject(ModelState.Values.SelectMany(v => v.Errors))
                };
            }

            // Ensure ownerUserId for bike is valid
            var checkOwnerResponse = await this._CheckOwnerUserIdIsValidVendor(newBikeDetails.OwnerUserId);
            if (checkOwnerResponse != null)
            {
                return checkOwnerResponse;
            }

            string addBikeUrl = $"http://{_bikesService}/api/bikes";
            var response = await HttpHelper.PostAsync(addBikeUrl, new StringContent(
                JsonConvert.SerializeObject(newBikeDetails), Encoding.UTF8, "application/json"), this.Request);
            if (response.IsSuccessStatusCode)
            {
                var createdBike = JsonConvert.DeserializeObject<Bike>(await response.Content.ReadAsStringAsync());
                return new JsonResult(createdBike);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }

        // GET: /api/bike/availableBikes
        // TODO: Add query filters.
        [HttpGet("availableBikes")]
        public async Task<IActionResult> FindAvailableBikes()
        {
            string findAvailableBikesUrl = $"http://{_bikesService}/api/availableBikes";
            var response = await HttpHelper.GetAsync(findAvailableBikesUrl, this.Request);
            if (response.IsSuccessStatusCode)
            {
                var foundBikes = JsonConvert.DeserializeObject<List<Bike>>(await response.Content.ReadAsStringAsync());
                return new JsonResult(foundBikes);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }
    }
}