namespace SignatureService.Models
{
    public class SignaturePenPointMessage
    {
        public string Type { get; set; } = "pen_point";
        public int X { get; set; }
        public int Y { get; set; }
        public int Pressure { get; set; }
        public bool IsDown { get; set; }
    }
}
