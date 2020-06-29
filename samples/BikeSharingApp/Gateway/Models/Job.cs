// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Newtonsoft.Json;

namespace app.Models
{
    public class Job
    {
        [JsonProperty("id")]
        public string Id {get; set;}
    }
}
