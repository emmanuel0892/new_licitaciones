namespace SignatureService.Models
{
    public class SignatureSaveResponse
    {
        public bool Success { get; set; }
        public string? ImageBase64 { get; set; }
        public string Message { get; set; } = "";
    }
}
