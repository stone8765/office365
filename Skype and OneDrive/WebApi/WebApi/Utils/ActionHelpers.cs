
namespace WebApi
{
    using System;
    using System.Web;

    public static class ActionHelpers
    {

        /// <summary>
        /// Trims the API URL at /drive to return the base URL we can use to build other API calls
        /// </summary>
        /// <param name="oneDriveApiSourceUrl"></param>
        /// <returns></returns>
        public static string ParseBaseUrl(string oneDriveApiSourceUrl)
        {
            var trimPoint = oneDriveApiSourceUrl.IndexOf("/drive");
            return oneDriveApiSourceUrl.Substring(0, trimPoint);
        }


        public static string BuildApiUrl(string baseUrl, string driveId, string itemId, string extra = "")
        {
            return $"{baseUrl}/drives/{driveId}/items/{itemId}/{extra}";
        }
    }
}
