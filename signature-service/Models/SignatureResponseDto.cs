namespace signature_service.Models
{
    public class SignatureResponseDto
    {
        public bool Success { get; set; }
        public string Code { get; set; } = "";
        public string Message { get; set; } = "";
        public string? Details { get; set; }
        public string? Image { get; set; }
        public object? Debug { get; set; }
    }
}
