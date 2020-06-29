// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Newtonsoft.Json;

namespace app.Models
{
    public class Bike
    {
        [JsonProperty("id")]
        public string Id { get; private set; }

        [JsonProperty("available")]
        public string Available { get; private set; }

        [JsonProperty("model")]
        public string Model { get; private set; }

        [JsonProperty("hourlyCost")]
        public float HourlyCost { get; private set; }

        [JsonProperty("imageUrl")]
        public string ImageUrl { get; private set; }

        [JsonProperty("address")]
        public string Address { get; private set; }

        [JsonProperty("type")]
        public string Type { get; private set; }

        [JsonProperty("ownerUserId")]
        public string OwnerUserId { get; private set; }

        [JsonProperty("suitableHeightInMeters")]
        public float SuitableHeightInMeters { get; private set; }

        [JsonProperty("maximumWeightInKg")]
        public float MaximumWeightInKg { get; private set; }
    }
}
