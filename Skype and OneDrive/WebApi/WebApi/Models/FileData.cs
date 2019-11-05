
namespace WebApi.Models
{
    using System.IO;

    public class FileData
    {
        public string Content { get; set; }

        public Stream FileStream { get; set; }

        public string Filename { get; set; }


    }
}