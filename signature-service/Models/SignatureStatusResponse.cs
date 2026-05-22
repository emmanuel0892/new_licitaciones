namespace SignatureService.Models
{
    public class SignatureStatusResponse
    {
        public bool ServiceRunning { get; set; }
        public bool Connected { get; set; }
        public string? Device { get; set; }
        public string Message { get; set; } = "";
        public bool SdkConnected { get; set; }
    }
}
