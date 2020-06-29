// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace app.Models
{
    public class Vendor : IVendor
    {
        public string Id { get; set; }
        public string UserID { get; set; }
        public string RoutingNumber { get; set; }
        public string AccountNumber { get; set; }
    }
}
