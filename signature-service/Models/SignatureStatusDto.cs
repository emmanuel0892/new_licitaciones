namespace signature_service.Models
{
    public class SignatureStatusDto
    {
        public bool Success { get; set; }
        public bool Connected { get; set; }
        public string Code { get; set; } = "";
        public string? Device { get; set; }
        public string Message { get; set; } = "";
        public string? Details { get; set; }
    }
}
