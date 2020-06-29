// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace app.Models
{
    public class CreateCustomerRequest : IUser, ICustomer
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string UserID { get; set; }
        public string CCNumber { get; set; }
        public string CCExpiry { get; set; }
        public string CCCCV { get; set; }
        public UserType Type { get; set; }
    }
}
