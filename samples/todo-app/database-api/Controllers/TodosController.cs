// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DatabaseApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TodosController : ControllerBase
    {
        [HttpGet]
        public IEnumerable<TodoTask> Get()
        {
            var todoTasks = MongoHelper.GetTasks();
            // TODO: FIX ME BY COMMENTING THE NEXT LINE.
            todoTasks = todoTasks.Select(todoTask => { todoTask.Completed = true; return todoTask; });
            return todoTasks;
        }

        [HttpPost]
        public async Task<TodoTask> Post([FromBody] TodoTask task)
        {
            return await MongoHelper.CreateTask(task);
        }

        [HttpPut]
        public async Task<IEnumerable<TodoTask>> Put(string id, [FromBody] TodoTask updatedTask)
        {
            return await MongoHelper.UpdateTask(id, updatedTask);
        }

        [HttpDelete]
        public async Task<IEnumerable<TodoTask>> Delete(string id)
        {
            return await MongoHelper.DeleteTask(id);
        }
    }
}
