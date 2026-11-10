namespace CombinedMaths.Api.Models;

public class StoredFile
{
    public string Id { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public string Folder { get; set; } = "general";
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public long SizeBytes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
