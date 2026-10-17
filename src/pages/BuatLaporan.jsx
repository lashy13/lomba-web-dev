import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/buat-laporan.css";

const API_WILAYAH =
  "https://www.emsifa.com/api-wilayah-indonesia/api";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const kategoriId = {
  jalan: 1,
  fasilitas: 2,
  drainase: 3,
  penerangan: 4,
  lingkungan: 5,
  transportasi: 6,
  keamanan: 7,
  lainnya: 8,
};

const sortWilayah = (data) =>
  [...data].sort((a, b) =>
    a.name.localeCompare(b.name, "id", {
      sensitivity: "base",
    }),
  );

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^kabupaten\s+/i, "")
    .replace(/^kab\.\s+/i, "")
    .replace(/^kota\s+/i, "")
    .replace(/^kec\.\s+/i, "")
    .replace(/[^a-z0-9]/g, "");

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Permintaan gagal dengan status ${response.status}.`,
    );
  }

  return result;
}

function BuatLaporan() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);

  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingRegency, setLoadingRegency] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingVillage, setLoadingVillage] = useState(false);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationFound, setLocationFound] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [locationData, setLocationData] = useState({
    provinceId: "",
    regencyId: "",
    districtId: "",
    villageId: "",
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    desa: "",
    alamat: "",
    latitude: "",
    longitude: "",
  });

  const [detailLokasi, setDetailLokasi] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");

  // ========================================
  // AMBIL PROVINSI
  // ========================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadProvinces() {
      setLoadingProvince(true);

      try {
        const data = await fetchJSON(
          `${API_WILAYAH}/provinces.json`,
          { signal: controller.signal },
        );

        if (!Array.isArray(data)) {
          throw new Error("Format data provinsi tidak valid.");
        }

        setProvinces(sortWilayah(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("PROVINCE ERROR:", error);
          setProvinces([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProvince(false);
        }
      }
    }

    loadProvinces();

    return () => controller.abort();
  }, []);

  // ========================================
  // AMBIL KABUPATEN / KOTA
  // ========================================

  useEffect(() => {
    if (!locationData.provinceId) return;

    const controller = new AbortController();

    async function loadRegencies() {
      setLoadingRegency(true);

      try {
        const data = await fetchJSON(
          `${API_WILAYAH}/regencies/${locationData.provinceId}.json`,
          { signal: controller.signal },
        );

        if (!Array.isArray(data)) {
          throw new Error("Format data kabupaten/kota tidak valid.");
        }

        setRegencies(sortWilayah(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("REGENCY ERROR:", error);
          setRegencies([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRegency(false);
        }
      }
    }

    loadRegencies();

    return () => controller.abort();
  }, [locationData.provinceId]);

  // ========================================
  // AMBIL KECAMATAN
  // ========================================

  useEffect(() => {
    if (!locationData.regencyId) return;

    const controller = new AbortController();

    async function loadDistricts() {
      setLoadingDistrict(true);

      try {
        const data = await fetchJSON(
          `${API_WILAYAH}/districts/${locationData.regencyId}.json`,
          { signal: controller.signal },
        );

        if (!Array.isArray(data)) {
          throw new Error("Format data kecamatan tidak valid.");
        }

        setDistricts(sortWilayah(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("DISTRICT ERROR:", error);
          setDistricts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDistrict(false);
        }
      }
    }

    loadDistricts();

    return () => controller.abort();
  }, [locationData.regencyId]);

  // ========================================
  // AMBIL DESA / KELURAHAN
  // ========================================

  useEffect(() => {
    if (!locationData.districtId) return;

    const controller = new AbortController();

    async function loadVillages() {
      setLoadingVillage(true);

      try {
        const data = await fetchJSON(
          `${API_WILAYAH}/villages/${locationData.districtId}.json`,
          { signal: controller.signal },
        );

        if (!Array.isArray(data)) {
          throw new Error("Format data desa/kelurahan tidak valid.");
        }

        setVillages(sortWilayah(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("VILLAGE ERROR:", error);
          setVillages([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVillage(false);
        }
      }
    }

    loadVillages();

    return () => controller.abort();
  }, [locationData.districtId]);

  // ========================================
  // PILIH PROVINSI
  // ========================================

  const handleProvinceChange = (event) => {
    const provinceId = event.target.value;
    const selected = provinces.find(
      (item) => String(item.id) === provinceId,
    );

    setLocationData((previous) => ({
      ...previous,
      provinceId,
      provinsi: selected?.name || "",
      regencyId: "",
      districtId: "",
      villageId: "",
      kabupaten: "",
      kecamatan: "",
      desa: "",
    }));

    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setLocationFound(false);
    setLocationError("");
  };

  // ========================================
  // PILIH KABUPATEN / KOTA
  // ========================================

  const handleRegencyChange = (event) => {
    const regencyId = event.target.value;
    const selected = regencies.find(
      (item) => String(item.id) === regencyId,
    );

    setLocationData((previous) => ({
      ...previous,
      regencyId,
      kabupaten: selected?.name || "",
      districtId: "",
      villageId: "",
      kecamatan: "",
      desa: "",
    }));

    setDistricts([]);
    setVillages([]);
    setLocationFound(false);
    setLocationError("");
  };

  // ========================================
  // PILIH KECAMATAN
  // ========================================

  const handleDistrictChange = (event) => {
    const districtId = event.target.value;
    const selected = districts.find(
      (item) => String(item.id) === districtId,
    );

    setLocationData((previous) => ({
      ...previous,
      districtId,
      kecamatan: selected?.name || "",
      villageId: "",
      desa: "",
    }));

    setVillages([]);
    setLocationFound(false);
    setLocationError("");
  };

  // ========================================
  // PILIH DESA / KELURAHAN
  // ========================================

  const handleVillageChange = (event) => {
    const villageId = event.target.value;
    const selected = villages.find(
      (item) => String(item.id) === villageId,
    );

    setLocationData((previous) => ({
      ...previous,
      villageId,
      desa: selected?.name || "",
    }));

    setLocationFound(false);
    setLocationError("");
  };

  // ========================================
  // CARI WILAYAH DARI GPS
  // ========================================

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Browser kamu tidak mendukung fitur lokasi.",
      );
      return;
    }

    if (provinces.length === 0) {
      setLocationError(
        "Data provinsi belum tersedia. Coba lagi sebentar.",
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    setLocationFound(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            "https://nominatim.openstreetmap.org/reverse" +
              `?lat=${latitude}&lon=${longitude}` +
              "&format=json&addressdetails=1&zoom=18",
            {
              headers: {
                Accept: "application/json",
                "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
              },
            },
          );

          if (!response.ok) {
            throw new Error(
              "Gagal mendapatkan alamat dari koordinat GPS.",
            );
          }

          const result = await response.json();
          const address = result.address || {};

          const provinceName =
            address.state ||
            address.province ||
            address.region ||
            "";

          const regencyName =
            address.city ||
            address.county ||
            address.town ||
            address.municipality ||
            "";

          const districtName =
            address.city_district ||
            address.district ||
            address.subdistrict ||
            "";

          const villageName =
            address.village ||
            address.suburb ||
            address.neighbourhood ||
            address.hamlet ||
            "";

          const selectedProvince = provinces.find(
            (item) =>
              normalizeName(item.name) ===
              normalizeName(provinceName),
          );

          setLocationData((previous) => ({
            ...previous,
            provinceId: selectedProvince
              ? String(selectedProvince.id)
              : "",
            provinsi: selectedProvince?.name || provinceName,
            regencyId: "",
            districtId: "",
            villageId: "",
            kabupaten: regencyName,
            kecamatan: districtName,
            desa: villageName,
            alamat: result.display_name || "",
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }));

          setRegencies([]);
          setDistricts([]);
          setVillages([]);

          if (!selectedProvince) {
            setLocationError(
              "Koordinat ditemukan, tetapi provinsi belum cocok. Silakan pilih wilayah secara manual.",
            );
            return;
          }

          const regencyData = sortWilayah(
            await fetchJSON(
              `${API_WILAYAH}/regencies/${selectedProvince.id}.json`,
            ),
          );

          setRegencies(regencyData);

          const selectedRegency = regencyData.find(
            (item) =>
              normalizeName(item.name) ===
              normalizeName(regencyName),
          );

          if (!selectedRegency) {
            setLocationError(
              "Provinsi ditemukan, tetapi kabupaten/kota belum cocok. Silakan pilih secara manual.",
            );
            return;
          }

          setLocationData((previous) => ({
            ...previous,
            regencyId: String(selectedRegency.id),
            kabupaten: selectedRegency.name,
          }));

          const districtData = sortWilayah(
            await fetchJSON(
              `${API_WILAYAH}/districts/${selectedRegency.id}.json`,
            ),
          );

          setDistricts(districtData);

          const selectedDistrict = districtData.find(
            (item) =>
              normalizeName(item.name) ===
              normalizeName(districtName),
          );

          if (!selectedDistrict) {
            setLocationError(
              "Kabupaten/kota ditemukan, tetapi kecamatan belum cocok. Silakan pilih secara manual.",
            );
            return;
          }

          setLocationData((previous) => ({
            ...previous,
            districtId: String(selectedDistrict.id),
            kecamatan: selectedDistrict.name,
          }));

          const villageData = sortWilayah(
            await fetchJSON(
              `${API_WILAYAH}/villages/${selectedDistrict.id}.json`,
            ),
          );

          setVillages(villageData);

          const selectedVillage = villageData.find(
            (item) =>
              normalizeName(item.name) ===
              normalizeName(villageName),
          );

          if (!selectedVillage) {
            setLocationError(
              "Kecamatan ditemukan, tetapi desa/kelurahan belum cocok. Silakan pilih secara manual.",
            );
            return;
          }

          setLocationData((previous) => ({
            ...previous,
            villageId: String(selectedVillage.id),
            desa: selectedVillage.name,
          }));

          setLocationFound(true);
          setLocationError("");
        } catch (error) {
          console.error("GPS ERROR:", error);

          setLocationError(
            "Lokasi GPS didapatkan, tetapi pencocokan wilayah gagal. Silakan pilih wilayah secara manual.",
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);

        if (error.code === 1) {
          setLocationError(
            "Izin lokasi ditolak. Izinkan akses lokasi pada browser.",
          );
        } else if (error.code === 2) {
          setLocationError(
            "Lokasi tidak ditemukan. Pastikan layanan lokasi perangkat aktif.",
          );
        } else if (error.code === 3) {
          setLocationError(
            "Pencarian lokasi terlalu lama. Silakan coba lagi.",
          );
        } else {
          setLocationError(
            "Terjadi kesalahan saat mengambil lokasi.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  // ========================================
  // PILIH FOTO
  // ========================================

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setPhotoError(
        "Gunakan foto JPEG, PNG, atau WebP.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Ukuran foto maksimal 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setPhotoError(
          "Foto gagal dibaca. Silakan pilih foto lain.",
        );
        return;
      }

      setSelectedPhoto(file);
      setPhotoPreview(reader.result);
    };

    reader.onerror = () => {
      setPhotoError(
        "Foto gagal dibaca. Silakan coba lagi.",
      );
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview("");
    setPhotoError("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  // ========================================
  // KIRIM LAPORAN
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const form = event.currentTarget;
    const token = localStorage.getItem("token");

    let user;

    try {
      user = JSON.parse(
        localStorage.getItem("user") || "null",
      );
    } catch {
      user = null;
    }

    if (
      !token ||
      !user ||
      localStorage.getItem("isLoggedIn") !== "true"
    ) {
      alert(
        "Silakan login terlebih dahulu untuk membuat laporan.",
      );
      navigate("/login");
      return;
    }

    const categoryCode = form.elements.kategori.value;
    const categoryId = kategoriId[categoryCode];

    if (!categoryId) {
      alert("Silakan pilih kategori laporan.");
      return;
    }

    if (
      !locationData.provinceId ||
      !locationData.regencyId ||
      !locationData.districtId ||
      !locationData.villageId
    ) {
      alert(
        "Lengkapi Provinsi, Kabupaten/Kota, Kecamatan, dan Desa/Kelurahan.",
      );
      return;
    }

    const title = form.elements.judul.value.trim();
    const description = form.elements.deskripsi.value.trim();

    if (!title || !description || !detailLokasi.trim()) {
      alert(
        "Judul, deskripsi, dan detail lokasi wajib diisi.",
      );
      return;
    }

    if (title.length > 200) {
      alert("Judul laporan maksimal 200 karakter.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        category_id: categoryId,
        title,
        description,

        province_id: String(locationData.provinceId),
        province_name: locationData.provinsi,

        regency_id: String(locationData.regencyId),
        regency_name: locationData.kabupaten,

        district_id: String(locationData.districtId),
        district_name: locationData.kecamatan,

        village_id: String(locationData.villageId),
        village_name: locationData.desa,

        address: locationData.alamat.trim(),
        location_detail: detailLokasi.trim(),

        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,

        photo: photoPreview || null,
        photo_name: selectedPhoto?.name || null,
      };

      const result = await fetchJSON(
        `${API_URL}/api/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (result?.success !== true) {
        throw new Error(
          result?.message ||
            "Server belum mengonfirmasi keberhasilan laporan.",
        );
      }

      window.dispatchEvent(new Event("laporanUpdated"));

      alert("Laporan berhasil dikirim!");

      navigate("/laporan-saya");
    } catch (error) {
      console.error("CREATE REPORT ERROR:", error);

      alert(
        error.message ||
          "Laporan gagal dikirim. Periksa koneksi dan backend.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // TAMPILAN
  // ========================================

  return (
    <main className="buat-laporan-page">
      <div className="buat-laporan-background">
        <div className="buat-laporan-grid" />
        <div className="buat-laporan-orb buat-laporan-orb-one" />
        <div className="buat-laporan-orb buat-laporan-orb-two" />
      </div>

      <header className="buat-laporan-header">
        <button
          type="button"
          className="buat-laporan-back"
          onClick={() => navigate(-1)}
        >
          <span>←</span>
          Kembali
        </button>

        <div className="buat-laporan-heading">
          <div className="buat-laporan-label">
            <span className="buat-laporan-label-dot" />
            LAPORKITA
          </div>

          <h1>Sampaikan laporanmu</h1>

          <p>
            Bantu kami mengetahui permasalahan di sekitarmu
            dengan memberikan informasi yang jelas dan lengkap.
          </p>
        </div>
      </header>

      <section className="buat-laporan-card">
        <form
          className="buat-laporan-form"
          onSubmit={handleSubmit}
        >
          {/* 01 — INFORMASI LAPORAN */}

          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-number">01</div>

              <div>
                <h2>Informasi laporan</h2>
                <p>
                  Jelaskan permasalahan yang ingin kamu laporkan.
                </p>
              </div>
            </div>

            <div className="laporan-form-group">
              <label htmlFor="judul">
                Judul laporan <span>*</span>
              </label>

              <input
                id="judul"
                name="judul"
                type="text"
                maxLength={200}
                placeholder="Contoh: Jalan berlubang di depan pasar"
                required
              />
            </div>

            <div className="laporan-form-group">
              <label htmlFor="kategori">
                Kategori <span>*</span>
              </label>

              <select
                id="kategori"
                name="kategori"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Pilih kategori laporan
                </option>
                <option value="jalan">Jalan Rusak</option>
                <option value="fasilitas">Fasilitas Umum</option>
                <option value="drainase">Drainase</option>
                <option value="penerangan">Penerangan Jalan</option>
                <option value="lingkungan">Lingkungan</option>
                <option value="transportasi">Transportasi</option>
                <option value="keamanan">Keamanan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div className="laporan-form-group">
              <label htmlFor="deskripsi">
                Deskripsi masalah <span>*</span>
              </label>

              <textarea
                id="deskripsi"
                name="deskripsi"
                rows={6}
                placeholder="Jelaskan kondisi atau permasalahan yang kamu temukan secara rinci..."
                required
              />

              <small>
                Jelaskan kondisi masalah dan informasi lain
                yang dapat membantu memahami laporan.
              </small>
            </div>
          </div>

          {/* 02 — LOKASI */}

          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-number">02</div>

              <div>
                <h2>Lokasi kejadian</h2>
                <p>
                  Tentukan lokasi laporan melalui GPS atau
                  pilih wilayah secara manual.
                </p>
              </div>
            </div>

            <div className="location-detector">
              <div className="location-detector-top">
                <div className="location-icon">
                  <span>⌖</span>
                </div>

                <div className="location-detector-content">
                  <strong>Gunakan lokasi saya</strong>
                  <p>
                    GPS membantu mengisi wilayah secara otomatis.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="location-button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                <span className="location-button-icon">
                  {locationLoading ? "◌" : "⌖"}
                </span>

                {locationLoading
                  ? "Mencari lokasi..."
                  : locationFound
                    ? "Perbarui lokasi"
                    : "Gunakan lokasi saya"}
              </button>

              {locationError && (
                <div className="location-error" role="alert">
                  <span>!</span>
                  <p>{locationError}</p>
                </div>
              )}
            </div>

            <div className="location-result">
              <div className="location-result-header">
                <div className="location-success-icon">
                  {locationFound ? "✓" : "⌖"}
                </div>

                <div>
                  <div className="location-success-title">
                    {locationFound
                      ? "Lokasi berhasil ditemukan"
                      : "Tentukan wilayah lokasi"}
                  </div>

                  <div className="location-success-subtitle">
                    Pilih wilayah secara manual jika hasil GPS
                    belum sesuai.
                  </div>
                </div>

                {locationFound && (
                  <div className="location-status">
                    GPS AKTIF
                  </div>
                )}
              </div>

              <div className="location-detail-grid">
                <div className="location-edit-field">
                  <label htmlFor="provinsi">Provinsi</label>

                  <select
                    id="provinsi"
                    value={locationData.provinceId}
                    onChange={handleProvinceChange}
                    required
                  >
                    <option value="">
                      {loadingProvince
                        ? "Memuat provinsi..."
                        : "Pilih provinsi"}
                    </option>

                    {provinces.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-edit-field">
                  <label htmlFor="kabupaten">
                    Kabupaten / Kota
                  </label>

                  <select
                    id="kabupaten"
                    value={locationData.regencyId}
                    onChange={handleRegencyChange}
                    disabled={
                      !locationData.provinceId || loadingRegency
                    }
                    required
                  >
                    <option value="">
                      {loadingRegency
                        ? "Memuat kabupaten/kota..."
                        : !locationData.provinceId
                          ? "Pilih provinsi dahulu"
                          : "Pilih kabupaten / kota"}
                    </option>

                    {regencies.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-edit-field">
                  <label htmlFor="kecamatan">Kecamatan</label>

                  <select
                    id="kecamatan"
                    value={locationData.districtId}
                    onChange={handleDistrictChange}
                    disabled={
                      !locationData.regencyId || loadingDistrict
                    }
                    required
                  >
                    <option value="">
                      {loadingDistrict
                        ? "Memuat kecamatan..."
                        : !locationData.regencyId
                          ? "Pilih kabupaten/kota dahulu"
                          : "Pilih kecamatan"}
                    </option>

                    {districts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-edit-field">
                  <label htmlFor="desa">
                    Desa / Kelurahan
                  </label>

                  <select
                    id="desa"
                    value={locationData.villageId}
                    onChange={handleVillageChange}
                    disabled={
                      !locationData.districtId || loadingVillage
                    }
                    required
                  >
                    <option value="">
                      {loadingVillage
                        ? "Memuat desa/kelurahan..."
                        : !locationData.districtId
                          ? "Pilih kecamatan dahulu"
                          : "Pilih desa / kelurahan"}
                    </option>

                    {villages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-edit-field location-edit-field-full">
                  <label htmlFor="alamat">
                    Alamat terdeteksi
                  </label>

                  <textarea
                    id="alamat"
                    rows={3}
                    value={locationData.alamat}
                    onChange={(event) =>
                      setLocationData((previous) => ({
                        ...previous,
                        alamat: event.target.value,
                      }))
                    }
                    placeholder="Alamat lengkap..."
                  />

                  <div className="location-address-help">
                    <span>i</span>
                    <p>
                      Periksa kembali alamat yang terdeteksi
                      dan sesuaikan jika diperlukan.
                    </p>
                  </div>
                </div>

                <div className="location-edit-field location-edit-field-full">
                  <label htmlFor="detailLokasi">
                    Patokan / detail lokasi <span>*</span>
                  </label>

                  <textarea
                    id="detailLokasi"
                    rows={3}
                    value={detailLokasi}
                    onChange={(event) =>
                      setDetailLokasi(event.target.value)
                    }
                    placeholder="Contoh: di depan minimarket, dekat lampu merah, sebelah sekolah..."
                    required
                  />

                  <small>
                    Tambahkan patokan agar lokasi lebih mudah
                    ditemukan.
                  </small>
                </div>
              </div>

              {locationData.latitude &&
                locationData.longitude && (
                  <div className="location-coordinate">
                    <div>
                      <span className="coordinate-label">
                        Koordinat GPS
                      </span>

                      <strong>
                        {locationData.latitude},{" "}
                        {locationData.longitude}
                      </strong>
                    </div>

                    <span className="coordinate-badge">GPS</span>
                  </div>
                )}

              <div className="location-edit-info">
                <span>✎</span>
                <p>
                  Wilayah bisa diubah secara manual. Kecamatan
                  mengikuti Kabupaten/Kota dan Desa/Kelurahan
                  mengikuti Kecamatan.
                </p>
              </div>
            </div>

            <div className="location-note">
              <span className="location-note-icon">i</span>
              <p>
                Urutan wilayah: Provinsi → Kabupaten/Kota →
                Kecamatan → Desa/Kelurahan.
              </p>
            </div>
          </div>

          {/* 03 — FOTO PENDUKUNG */}

          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-number">03</div>

              <div>
                <h2>Foto pendukung</h2>
                <p>
                  Tambahkan foto untuk membantu menjelaskan
                  kondisi di lokasi.
                </p>
              </div>
            </div>

            <div className="upload-area">
              <input
                ref={photoInputRef}
                type="file"
                id="foto"
                className="upload-input"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                aria-label="Pilih foto bukti laporan"
              />

              {!photoPreview ? (
                <label
                  htmlFor="foto"
                  className="upload-content"
                >
                  <div className="upload-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="4"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>

                  <h3>Unggah foto bukti</h3>

                  <p>
                    Pilih foto kondisi jalan atau fasilitas umum
                    yang ingin kamu laporkan.
                  </p>

                  <span className="upload-button">
                    Pilih foto
                  </span>

                  <small>
                    JPG, PNG, atau WebP · Maksimal 2 MB
                  </small>
                </label>
              ) : (
                <div className="photo-preview">
                  <div className="photo-preview-heading">
                    <div>
                      <span className="photo-preview-check">
                        ✓
                      </span>

                      <div>
                        <strong>Foto berhasil dipilih</strong>
                        <p>
                          Periksa foto sebelum mengirim laporan.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="photo-change-button"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      Ganti foto
                    </button>
                  </div>

                  <img
                    src={photoPreview}
                    alt="Pratinjau foto bukti laporan"
                  />

                  <div className="photo-preview-footer">
                    <div className="photo-file-info">
                      <span className="photo-file-icon">
                        ▧
                      </span>

                      <div>
                        <strong>
                          {selectedPhoto?.name}
                        </strong>
                        <small>
                          {selectedPhoto
                            ? `${(selectedPhoto.size / 1024).toFixed(0)} KB`
                            : ""}
                        </small>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-photo-button"
                      onClick={handleRemovePhoto}
                    >
                      Hapus foto
                    </button>
                  </div>
                </div>
              )}

              {photoError && (
                <p role="alert" className="photo-error">
                  {photoError}
                </p>
              )}
            </div>
          </div>

          {/* KIRIM LAPORAN */}

          <div className="laporan-submit">
            <div className="submit-info">
              <span>✓</span>
              <p>
                Pastikan informasi yang kamu masukkan sudah
                sesuai sebelum mengirim laporan.
              </p>
            </div>

            <button
              type="submit"
              className="laporan-submit-button"
              disabled={submitting}
            >
              <span>
                {submitting
                  ? "Mengirim laporan..."
                  : "Kirim laporan"}
              </span>

              <span>{submitting ? "◌" : "→"}</span>
            </button>
          </div>
        </form>
      </section>

      <footer className="buat-laporan-footer">
        LaporKita · Bersama menyampaikan informasi untuk
        lingkungan yang lebih baik.
      </footer>
    </main>
  );
}

export default BuatLaporan;
