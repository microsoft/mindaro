// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
    [Route("api/billing")]
    public class BillingController : Controller
    {
        private string _billingsService { get; set; }

        private CustomConfiguration _customConfiguration { get; set; }

        public BillingController(IOptions<CustomConfiguration> customConfiguration)
        {
            _customConfiguration = customConfiguration.Value;
            _billingsService = Environment.GetEnvironmentVariable(Constants.BillingMicroserviceEnv) ?? _customConfiguration.Services.Billing;
        }

        // GET: api/billing/invoice/1
        [HttpGet("invoice/{invoiceId}")]
        public async Task<IActionResult> GetInvoice(string invoiceId)
        {
            string getInvoiceUrl = $"http://{_billingsService}/api/invoice/{invoiceId}";
            var response = await HttpHelper.GetAsync(getInvoiceUrl, this.Request);
            if (response.IsSuccessStatusCode)
            {
                var invoiceDetails = JsonConvert.DeserializeObject<Invoice>(await response.Content.ReadAsStringAsync());
                return new JsonResult(invoiceDetails);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }

        // Not called from gateway.
        public async Task<IActionResult> CreateInvoice([FromBody] Invoice newInvoice)
        {
            string createInvoiceUrl = $"http://{_billingsService}/api/invoice";
            var response = await HttpHelper.PostAsync(createInvoiceUrl, new StringContent(
                JsonConvert.SerializeObject(newInvoice), Encoding.UTF8, "application/json"), this.Request);
            if (response.IsSuccessStatusCode)
            {
                var createdInvoice = JsonConvert.DeserializeObject<Invoice>(await response.Content.ReadAsStringAsync());
                return new JsonResult(createdInvoice);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }

        // GET: api/billing/customer/1
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetCustomerBillingData(string customerId)
        {
            string getCustomerDataUrl = $"http://{_billingsService}/api/customer/{customerId}";
            var response = await HttpHelper.GetAsync(getCustomerDataUrl, this.Request);
            if (response.IsSuccessStatusCode)
            {
                var customerBillingDetails = JsonConvert.DeserializeObject<Customer>(await response.Content.ReadAsStringAsync());
                return new JsonResult(customerBillingDetails);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }

        // PATCH: /api/billing/customer
        [HttpPatch("customer")]
        public async Task<IActionResult> UpdateCustomerBillingData([FromBody] Customer customerData)
        {
            if (!ModelState.IsValid)
            {
                return new ContentResult
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Content = JsonConvert.SerializeObject(ModelState.Values.SelectMany(v => v.Errors))
                };
            }

            string updateCustomerDataUrl = $"http://{_billingsService}/api/customer";
            var response = await HttpHelper.PatchAsync(updateCustomerDataUrl, new StringContent(
                JsonConvert.SerializeObject(customerData), Encoding.UTF8, "application/json"), this.Request);
            if (!response.IsSuccessStatusCode)
            {
                return await HttpHelper.ReturnResponseResult(response);
            }

            var updatedCustomerData = JsonConvert.DeserializeObject<Customer>(await response.Content.ReadAsStringAsync());
            return Json(updatedCustomerData);
        }

        // GET: api/billing/vendor/1
        [HttpGet("vendor/{vendorId}")]
        public async Task<IActionResult> GetVendor(string vendorId)
        {
            string getVendorUrl = $"http://{_billingsService}/api/vendor/{vendorId}";
            var response = await HttpHelper.GetAsync(getVendorUrl, this.Request);
            if (response.IsSuccessStatusCode)
            {
                var vendorDetails = JsonConvert.DeserializeObject<Vendor>(await response.Content.ReadAsStringAsync());
                return new JsonResult(vendorDetails);
            }

            return await HttpHelper.ReturnResponseResult(response);
        }

        // PATCH: /api/billing/vendor
        [HttpPatch("vendor")]
        public async Task<IActionResult> UpdateVendor([FromBody] Vendor vendorDetails)
        {
            if (!ModelState.IsValid)
            {
                return new ContentResult
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Content = JsonConvert.SerializeObject(ModelState.Values.SelectMany(v => v.Errors))
                };
            }

            string updateVendorDataUrl = $"http://{_billingsService}/api/vendor";
            var response = await HttpHelper.PatchAsync(updateVendorDataUrl, new StringContent(
                JsonConvert.SerializeObject(vendorDetails), Encoding.UTF8, "application/json"), this.Request);
            if (!response.IsSuccessStatusCode)
            {
                return await HttpHelper.ReturnResponseResult(response);
            }

            var updatedVendorData = JsonConvert.DeserializeObject<Vendor>(await response.Content.ReadAsStringAsync());
            return Json(updatedVendorData);
        }
    }
}