// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [Route("hello")]
    public class HelloController : Controller
    {
        // GET: hello
        [HttpGet]
        public string Hello()
        {
            return "Hello!";
        }
    }
}
