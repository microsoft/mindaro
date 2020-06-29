// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace app.Models
{
    public class AddUpdateBikeRequest
    {
        [JsonProperty("model")]
        [Required]
        public string Model { get; set; }

        [JsonProperty("hourlyCost")]
        [Required]
        public float? HourlyCost { get; set; }

        [JsonProperty("imageUrl")]
        [Required]
        public string ImageUrl { get; set; }

        [JsonProperty("address")]
        [Required]
        public string Address { get; set; }

        [JsonProperty("type")]
        [Required]
        public string Type { get; set; }

        [JsonProperty("ownerUserId")]
        [Required]
        public string OwnerUserId { get; set; }

        [JsonProperty("suitableHeightInMeters")]
        [Required]
        public float? SuitableHeightInMeters { get; set; }

        [JsonProperty("maximumWeightInKg")]
        [Required]
        public float? MaximumWeightInKg { get; set; }
    }
}
