
using Microsoft.Graph;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    [RoutePrefix("file")]
    [AllowAnonymous]
    public class OneDriveFileController : ApiController
    {
        public OneDriveFileController()
        {

        }

        public class OfficeParameters
        {
            public string accessToken { get; set; }
        }

        public class CreateLinkParameters : OfficeParameters
        {
            public string type { get; set; }
            public string scope { get; set; }
            public string webUrl { get; set; }
        }

        public class UploadFileParameters : OfficeParameters
        {
            public string driveItemId { get; set; }
        }

        public class DownloadFileParameters : OfficeParameters
        {
            public string driveItemId { get; set; }
        }

        public class SubscriptionParameters : OfficeParameters
        {
            public string driveItemId { get; set; }
        }

        [HttpGet]
        [Route("sharingLink")]
        public string Test()
        {
            return "tests";
        }

        [HttpPost]
        [Route("sharingLink")]
        public async Task<IHttpActionResult> SharingLink(CreateLinkParameters parameters)
        {
            if (string.IsNullOrEmpty(parameters.accessToken)) return Unauthorized();
            if (string.IsNullOrEmpty(parameters.webUrl)) return BadRequest();
            if (string.IsNullOrEmpty(parameters.type)) return BadRequest();
            if (string.IsNullOrEmpty(parameters.scope)) return BadRequest();

            try
            {
                var createLinkParameters = new { type = parameters.type, scope = parameters.scope };
                var permission = await HttpHelper.Default.PostAsync<Permission>(createLinkParameters, parameters.webUrl, parameters.accessToken);
                return Ok(new ShareLinkResults { Success = true, SharingUrl = permission?.Link?.WebUrl });
            }
            catch (Exception ex)
            {
                return Ok(new SaveResults { Success = false, Error = ex.Message });
            }
        }

        [HttpPost]
        [Route("uploadFile")]
        public async Task<IHttpActionResult> UploadFile(UploadFileParameters parameters)
        {
            if (string.IsNullOrEmpty(parameters.accessToken)) return Unauthorized();
            if (string.IsNullOrEmpty(parameters.driveItemId)) return BadRequest();

            try
            {
                var graphClient = new GraphServiceClient("https://graph.microsoft.com/v1.0",
                        new DelegateAuthenticationProvider(
                            async (requestMessage) =>
                            {
                                var token = await Task.FromResult<string>(parameters.accessToken);
                                requestMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("bearer", token);
                            }));


                var items = await graphClient.Me.Drive.Root.Children.Request().GetAsync();
                var item1 = items.First();
                //item1.AdditionalData = item1.AdditionalData ?? new Dictionary<string, object>();
                //item1.AdditionalData.Add("rib@odata.xx", 123456);

                item1.Name = "test";

                DriveItem driveItem = new DriveItem();
                driveItem.Name = "ts";
                driveItem.AdditionalData = new Dictionary<string, object>();
                driveItem.AdditionalData.Add("rib@odata.xx", 123456);

                await graphClient.Me.Drive.Items[item1.Id].Request().UpdateAsync(driveItem);
               
                
                var newitem = await graphClient.Me.Drive.Items[item1.Id].Request().GetAsync();

                var data = newitem.AdditionalData;

                return Ok(new SaveResults { Success = false});

                //var item = await OneDriveUploadLargeFile(graphClient, parameters.driveItemId);

                //return Ok(new UploadResults { Success = true, Filename = item.Name, ItemId = item.Id });
            }
            catch (Exception ex)
            {
                return Ok(new SaveResults { Success = false, Error = ex.Message });
            }
        }


        public async Task<DriveItem> OneDriveUploadLargeFile(GraphServiceClient graphClient, string driveItemId)
        {
            try
            {
                string path = @"C:\Users\two\Desktop\StoneLi\skype-demo\trunk\WebApi\WebApi\upload\english-book.pdf";
                string newFileName = "english-book.pdf";
                using (System.IO.FileStream fs = System.IO.File.OpenRead(path))
                {
                    // Describe the file to upload. Pass into CreateUploadSession, when the service works as expected.
                    var props = new DriveItemUploadableProperties();
                    props.Name = newFileName;
                    props.Description = "This is a pdf book.";
                    props.FileSystemInfo = new FileSystemInfo();
                    props.FileSystemInfo.CreatedDateTime = System.DateTimeOffset.Now;
                    props.FileSystemInfo.LastModifiedDateTime = System.DateTimeOffset.Now;

                    // Get the provider. 
                    // POST /v1.0/drive/items/01KA5JMEBZ7FQ7QYBXKJE3X3THBVZLQIUS:/_hamiltion.png:/microsoft.graph.createUploadSession
                    // The CreateUploadSesssion action doesn't seem to support the options stated in the metadata.
                    var uploadSession = await graphClient.Me.Drive.Items[driveItemId].ItemWithPath(newFileName).CreateUploadSession().Request().PostAsync();

                    var maxChunkSize = 320 * 1024; // 320 KB - Change this to your chunk size. 5MB is the default.
                    var provider = new ChunkedUploadProvider(uploadSession, graphClient, fs, maxChunkSize);

                    // Setup the chunk request necessities
                    var chunkRequests = provider.GetUploadChunkRequests();
                    var readBuffer = new byte[maxChunkSize];
                    var trackedExceptions = new List<Exception>();
                    DriveItem itemResult = null;

                    //upload the chunks
                    foreach (var request in chunkRequests)
                    {
                        // Do your updates here: update progress bar, etc.
                        // ...
                        // Send chunk request
                        var result = await provider.GetChunkRequestResponseAsync(request, readBuffer, trackedExceptions);

                        if (result.UploadSucceeded)
                        {
                            itemResult = result.ItemResponse;
                        }
                    }

                    // Check that upload succeeded
                    if (itemResult == null)
                    {
                        // Retry the upload
                        // ...
                    }

                    return await Task.FromResult<DriveItem>(itemResult);
                }
            }
            catch (Microsoft.Graph.ServiceException e)
            {
                throw;
            }
        }

        [HttpPost]
        [Route("downloadFile")]
        public async Task<IHttpActionResult> DownloadFile(DownloadFileParameters parameters)
        {
            if (string.IsNullOrEmpty(parameters.accessToken)) return Unauthorized();
            if (string.IsNullOrEmpty(parameters.driveItemId)) return BadRequest();

            try
            {
                var graphClient = new GraphServiceClient("https://graph.microsoft.com/v1.0",
                        new DelegateAuthenticationProvider(
                            async (requestMessage) =>
                            {
                                var token = await Task.FromResult<string>(parameters.accessToken);
                                requestMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("bearer", token);
                            }));


                var result = await OneDriveDownloadLargeFile(graphClient, parameters.driveItemId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(new SaveResults { Success = false, Error = ex.Message });
            }
        }

        public async Task<SaveResults> OneDriveDownloadLargeFile(GraphServiceClient graphClient, string driveItemId)
        {
            // Based on question by Pavan Tiwari, 11/26/2012, and answer by Simon Mourier
            // https://stackoverflow.com/questions/13566302/download-large-file-in-small-chunks-in-c-sharp
            string rootPath = AppDomain.CurrentDomain.BaseDirectory + "\\download\\";
            const long DefaultChunkSize = 50 * 1024 * 1024 * 10; // 50 KB, TODO: change chunk size to make it realistic for a large file.
            long ChunkSize = DefaultChunkSize;
            long offset = 0;                         // cursor location for updating the Range header.
            byte[] bytesInStream;                    // bytes in range returned by chunk download.

            try
            {
                // We'll use the file metadata to determine size and the name of the downloaded file
                // and to get the download URL.
                var driveItemInfo = await graphClient.Me.Drive.Items[driveItemId].Request().GetAsync();

                // Get the download URL. This URL is preauthenticated and has a short TTL.
                object downloadUrl;
                driveItemInfo.AdditionalData.TryGetValue("@microsoft.graph.downloadUrl", out downloadUrl);

                // Get the number of bytes to download. calculate the number of chunks and determine
                // the last chunk size.
                long size = (long)driveItemInfo.Size;
                int numberOfChunks = Convert.ToInt32(size / DefaultChunkSize);
                // We are incrementing the offset cursor after writing the response stream to a file after each chunk. 
                // Subtracting one since the size is 1 based, and the range is 0 base. There should be a better way to do
                // this but I haven't spent the time on that.
                int lastChunkSize = Convert.ToInt32(size % DefaultChunkSize);
                if (lastChunkSize > 0) { numberOfChunks++; }

                string filePath = rootPath + driveItemInfo.Name;
                // Create a file stream to contain the downloaded file.
                using (System.IO.FileStream fileStream = System.IO.File.Create(filePath))
                {
                    for (int i = 0; i < numberOfChunks; i++)
                    {
                        // Setup the last chunk to request. This will be called at the end of this loop.
                        if (i == numberOfChunks - 1)
                        {
                            ChunkSize = lastChunkSize;
                        }

                        // Create the request message with the download URL and Range header.
                        HttpRequestMessage req = new HttpRequestMessage(HttpMethod.Get, (string)downloadUrl);
                        req.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(offset, ChunkSize + offset);

                        // We can use the the client library to send this although it does add an authentication cost.
                        // HttpResponseMessage response = await graphClient.HttpProvider.SendAsync(req);
                        // Since the download URL is preauthenticated, and we aren't deserializing objects, 
                        // we'd be better to make the request with HttpClient.
                        var client = new HttpClient();
                        HttpResponseMessage response = await client.SendAsync(req);

                        using (System.IO.Stream responseStream = await response.Content.ReadAsStreamAsync())
                        {
                            bytesInStream = new byte[ChunkSize];
                            int read;
                            do
                            {
                                read = responseStream.Read(bytesInStream, 0, (int)bytesInStream.Length);
                                if (read > 0)
                                    fileStream.Write(bytesInStream, 0, bytesInStream.Length);
                            }
                            while (read > 0);
                        }
                        offset += ChunkSize + 1; // Move the offset cursor to the next chunk.
                    }
                }

                return await Task.FromResult<SaveResults>(new SaveResults() { Success = true, Filename = filePath });
            }
            catch (Microsoft.Graph.ServiceException e)
            {
                throw;
            }
        }

        [HttpPost]
        [Route("createSubscription")]
        public async Task<Subscription> CreateSubscription(SubscriptionParameters parameters)
        {
            var graphClient = new GraphServiceClient("https://graph.microsoft.com/v1.0",
                         new DelegateAuthenticationProvider(
                             async (requestMessage) =>
                             {
                                 var token = await Task.FromResult<string>(parameters.accessToken);
                                 requestMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("bearer", token);
                             }));
            Subscription subscription = new Subscription()
            {
                ChangeType = "created,updated",
                NotificationUrl = "https://c0695efc.ngrok.io/file/listen",
                AdditionalData = new Dictionary<string, object>() { { "token", 1234 } },
                Resource = "me/drive/root",
                ClientState = "my client state",
                ExpirationDateTime = DateTimeOffset.Now.AddDays(1)
            };
            var result = await graphClient.Subscriptions.Request().AddAsync(subscription);
            return result;
        }

        [HttpPost]
        [Route("listen")]
        public async Task<HttpResponseMessage> Listen([FromUri]string validationToken = null)
        {
            if (!string.IsNullOrEmpty(validationToken))
            {
                HttpResponseMessage msg = new HttpResponseMessage();
                msg.StatusCode = HttpStatusCode.OK;
                msg.Content = new StringContent(validationToken, Encoding.UTF8, "text/plain");
                return msg;
            }
            var notifications = await ParseIncomingNotificationAsync();
            if (null != notifications && notifications.Any())
            {
                await ProcessNotificationsAsync(notifications);
            }

            return new HttpResponseMessage(HttpStatusCode.OK);
        }


        private async Task<OneDriveWebhookNotification[]> ParseIncomingNotificationAsync()
        {
            try
            {
                var inputString = await Request.Content.ReadAsStringAsync();
                var collection = JsonConvert.DeserializeObject<OneDriveNotificationCollection>(inputString);
                if (collection != null && collection.Notifications != null)
                {
                    return collection.Notifications;
                }
            }
            catch { }
            return null;
        }

        private async Task ProcessNotificationsAsync(OneDriveWebhookNotification[] notifications)
        {
            foreach (var notification in notifications)
            {
                await ProcessChangesToUserFolder(notification);
            }
        }

        private async Task ProcessChangesToUserFolder(OneDriveWebhookNotification notification)
        {


        }


    }
}