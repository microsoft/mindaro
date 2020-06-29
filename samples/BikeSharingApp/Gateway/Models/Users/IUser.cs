// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace app.Models
{
    public interface IUser
    {
        [JsonProperty("id")]
        string Id { get; set; }

        [JsonProperty("name")]
        [Required]
        string Name { get; set; }

        [JsonProperty("address")]
        [Required]
        string Address { get; set; }

        [JsonProperty("phone")]
        string Phone { get; set; }

        [JsonProperty("email")]
        [Required]
        string Email { get; set; }

        [JsonProperty("type")]
        [JsonConverter(typeof(StringEnumConverter))]
        UserType Type { get; set; }
    }

    public enum UserType
    {
        [EnumMember(Value = "customer")]
        Customer,
        [EnumMember(Value = "vendor")]
        Vendor
    }
}
