// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Newtonsoft.Json;

namespace app.Models
{
    public interface IVendor
    {
        [JsonProperty("id")]
        string Id { get; set; }

        [JsonProperty("userId")]
        string UserID { get; set; }

        [JsonProperty("routingNumber")]
        string RoutingNumber { get; set; }

        [JsonProperty("accountNumber")]
        string AccountNumber { get; set; }
    }
}
