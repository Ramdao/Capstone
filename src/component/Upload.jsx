import { useState } from "react";
import { storage, ref, uploadBytesResumable, getDownloadURL } from "../firebase";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [folderName, setFolderName] = useState("clients/defaultUser");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file || !folderName) return alert("File and folder name are required.");

    const path = `${folderName}/${file.name}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        alert("Upload failed.");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadUrl(url);
          alert("Upload complete!");
        });
      }
    );
  };

  return (
    <div>
      <h3>Upload .glb to Custom Folder</h3>
      <input type="text" placeholder="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
      <input type="file" accept=".glb" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <div>Upload Progress: {uploadProgress.toFixed(0)}%</div>
      {downloadUrl && <p>File URL: <a href={downloadUrl} target="_blank">{downloadUrl}</a></p>}
    </div>
  );
}
