using signature_service.Services;
using signature_service.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddSingleton<WacomSignatureService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalNextApp", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("LocalNextApp");

app.MapControllers();
app.MapHub<SignatureHub>("/signatureHub");

app.MapGet("/health", () => Results.Ok(new
{
    success = true,
    code = "SERVICE_RUNNING",
    message = "Servicio local de firmas iniciado correctamente.",
    details = "El servicio está disponible en http://localhost:5001."
}));

app.Run("http://localhost:5001");
