import { useEffect, useState } from "react";

import "../styles/buat-laporan.css";

const API_WILAYAH = "https://www.emsifa.com/api-wilayah-indonesia/api";

const kategoriLabel = {
  jalan: "Jalan dan transportasi",
  fasilitas: "Fasilitas umum",
  penerangan: "Penerangan jalan",
  lingkungan: "Lingkungan",
  drainase: "Drainase dan saluran air",
  lainnya: "Lainnya",
};

const sortWilayah = (data) => {
  return [...data].sort((a, b) =>
    a.name.localeCompare(b.name, "id", {
      sensitivity: "base",
    }),
  );
};

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/^kabupaten\s+/i, "")
    .replace(/^kab\.\s+/i, "")
    .replace(/^kota\s+/i, "")
    .replace(/^kec\.\s+/i, "")
    .replace(/[^a-z0-9]/g, "");

function BuatLaporan() {
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

  /* ========================================
     AMBIL PROVINSI
  ======================================== */

  useEffect(() => {
    const getProvinces = async () => {
      setLoadingProvince(true);

      try {
        const response = await fetch(`${API_WILAYAH}/provinces.json`);

        if (!response.ok) {
          throw new Error("Gagal mengambil provinsi");
        }

        const data = await response.json();

        setProvinces(sortWilayah(data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProvince(false);
      }
    };

    getProvinces();
  }, []);

  /* ========================================
     AMBIL KABUPATEN / KOTA
  ======================================== */

  useEffect(() => {
    if (!locationData.provinceId) {
      return;
    }

    const getRegencies = async () => {
      setLoadingRegency(true);

      try {
        const response = await fetch(
          `${API_WILAYAH}/regencies/${locationData.provinceId}.json`,
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil kabupaten/kota");
        }

        const data = await response.json();

        setRegencies(sortWilayah(data));
      } catch (error) {
        console.error(error);
        setRegencies([]);
      } finally {
        setLoadingRegency(false);
      }
    };

    getRegencies();
  }, [locationData.provinceId]);

  /* ========================================
     AMBIL KECAMATAN
  ======================================== */

  useEffect(() => {
    if (!locationData.regencyId) {
      return;
    }

    const getDistricts = async () => {
      setLoadingDistrict(true);

      try {
        const response = await fetch(
          `${API_WILAYAH}/districts/${locationData.regencyId}.json`,
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil kecamatan");
        }

        const data = await response.json();

        setDistricts(sortWilayah(data));
      } catch (error) {
        console.error(error);
        setDistricts([]);
      } finally {
        setLoadingDistrict(false);
      }
    };

    getDistricts();
  }, [locationData.regencyId]);

  /* ========================================
     AMBIL DESA / KELURAHAN
  ======================================== */

  useEffect(() => {
    if (!locationData.districtId) {
      return;
    }

    const getVillages = async () => {
      setLoadingVillage(true);

      try {
        const response = await fetch(
          `${API_WILAYAH}/villages/${locationData.districtId}.json`,
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil desa/kelurahan");
        }

        const data = await response.json();

        setVillages(sortWilayah(data));
      } catch (error) {
        console.error(error);
        setVillages([]);
      } finally {
        setLoadingVillage(false);
      }
    };

    getVillages();
  }, [locationData.districtId]);

  /* ========================================
     PROVINSI
  ======================================== */

  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;

    const selectedProvince = provinces.find(
      (item) => String(item.id) === String(provinceId),
    );

    setLocationData((prev) => ({
      ...prev,

      provinceId,

      provinsi: selectedProvince?.name || "",

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
  };

  /* ========================================
     KABUPATEN
  ======================================== */

  const handleRegencyChange = (e) => {
    const regencyId = e.target.value;

    const selectedRegency = regencies.find(
      (item) => String(item.id) === String(regencyId),
    );

    setLocationData((prev) => ({
      ...prev,

      regencyId,

      kabupaten: selectedRegency?.name || "",

      districtId: "",
      villageId: "",

      kecamatan: "",
      desa: "",
    }));

    setDistricts([]);
    setVillages([]);
  };

  /* ========================================
     KECAMATAN
  ======================================== */

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;

    const selectedDistrict = districts.find(
      (item) => String(item.id) === String(districtId),
    );

    setLocationData((prev) => ({
      ...prev,

      districtId,

      kecamatan: selectedDistrict?.name || "",

      villageId: "",
      desa: "",
    }));

    setVillages([]);
  };

  /* ========================================
     DESA
  ======================================== */

  const handleVillageChange = (e) => {
    const villageId = e.target.value;

    const selectedVillage = villages.find(
      (item) => String(item.id) === String(villageId),
    );

    setLocationData((prev) => ({
      ...prev,

      villageId,

      desa: selectedVillage?.name || "",
    }));
  };

  /* ========================================
     GPS
  ======================================== */

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser kamu tidak mendukung fitur lokasi.");

      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
            {
              headers: {
                Accept: "application/json",

                "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Gagal mendapatkan lokasi");
          }

          const data = await response.json();

          const address = data.address || {};

          const namaProvinsi =
            address.state || address.province || address.region || "";

          const namaKabupaten =
            address.county || address.city || address.town || "";

          const namaKecamatan =
            address.district ||
            address.subdistrict ||
            address.municipality ||
            address.city_district ||
            "";

          const namaDesa =
            address.village ||
            address.suburb ||
            address.neighbourhood ||
            address.hamlet ||
            "";

          const selectedProvince = provinces.find(
            (item) => normalizeName(item.name) === normalizeName(namaProvinsi),
          );

          setLocationData((prev) => ({
            ...prev,

            provinceId: selectedProvince?.id || "",

            provinsi: selectedProvince?.name || namaProvinsi,

            kabupaten: namaKabupaten,

            kecamatan: namaKecamatan,

            desa: namaDesa,

            alamat: data.display_name || "",

            latitude: latitude.toFixed(6),

            longitude: longitude.toFixed(6),
          }));

          setLocationFound(true);

          /* =========================
             CARI KABUPATEN
          ========================= */

          if (selectedProvince?.id) {
            const regencyResponse = await fetch(
              `${API_WILAYAH}/regencies/${selectedProvince.id}.json`,
            );

            if (!regencyResponse.ok) {
              throw new Error("Gagal mengambil kabupaten/kota");
            }

            const regencyData = await regencyResponse.json();

            const regencyList = sortWilayah(regencyData);

            setRegencies(regencyList);

            const gpsRegency = normalizeName(namaKabupaten);

            const selectedRegency = regencyList.find((item) => {
              const itemName = normalizeName(item.name);

              return (
                itemName === gpsRegency ||
                itemName.includes(gpsRegency) ||
                gpsRegency.includes(itemName)
              );
            });

            if (selectedRegency) {
              setLocationData((prev) => ({
                ...prev,

                regencyId: selectedRegency.id,

                kabupaten: selectedRegency.name,
              }));

              /* =========================
                 CARI KECAMATAN
              ========================= */

              const districtResponse = await fetch(
                `${API_WILAYAH}/districts/${selectedRegency.id}.json`,
              );

              if (!districtResponse.ok) {
                throw new Error("Gagal mengambil kecamatan");
              }

              const districtData = await districtResponse.json();

              const districtList = sortWilayah(districtData);

              setDistricts(districtList);

              const gpsDistrict = normalizeName(namaKecamatan);

              const selectedDistrict = districtList.find(
                (item) => normalizeName(item.name) === gpsDistrict,
              );

              if (selectedDistrict) {
                setLocationData((prev) => ({
                  ...prev,

                  districtId: selectedDistrict.id,

                  kecamatan: selectedDistrict.name,
                }));

                /* =========================
                   CARI DESA
                ========================= */

                const villageResponse = await fetch(
                  `${API_WILAYAH}/villages/${selectedDistrict.id}.json`,
                );

                if (!villageResponse.ok) {
                  throw new Error("Gagal mengambil desa/kelurahan");
                }

                const villageData = await villageResponse.json();

                const villageList = sortWilayah(villageData);

                setVillages(villageList);

                const gpsVillage = normalizeName(namaDesa);

                const selectedVillage = villageList.find(
                  (item) => normalizeName(item.name) === gpsVillage,
                );

                if (selectedVillage) {
                  setLocationData((prev) => ({
                    ...prev,

                    villageId: selectedVillage.id,

                    desa: selectedVillage.name,
                  }));
                }
              }
            }
          }
        } catch (error) {
          console.error("LOCATION ERROR:", error);

          setLocationError(
            "Lokasi ditemukan, tetapi data wilayah gagal diambil.",
          );

          setLocationFound(false);
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
            "Lokasi tidak ditemukan. Pastikan GPS perangkat aktif.",
          );
        } else if (error.code === 3) {
          setLocationError("Pencarian lokasi terlalu lama. Silakan coba lagi.");
        } else {
          setLocationError("Terjadi kesalahan saat mengambil lokasi.");
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  /* ========================================
     FOTO
  ======================================== */

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("File yang dipilih harus berupa gambar.");

      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2 MB.");

      e.target.value = "";
      return;
    }

    setSelectedPhoto(file);

    const reader = new FileReader();

    reader.onload = () => {
      setPhotoPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  /* ========================================
     SUBMIT LAPORAN
  ======================================== */

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;

    /* =========================
       USER
    ========================= */

    const rawUser = localStorage.getItem("user");

    let user;

    try {
      user = rawUser ? JSON.parse(rawUser) : null;
    } catch {
      user = null;
    }

    if (!user?.email) {
      alert("Silakan login terlebih dahulu.");

      return;
    }

    /* =========================
       VALIDASI LOKASI
    ========================= */

    if (
      !locationData.provinceId ||
      !locationData.regencyId ||
      !locationData.districtId ||
      !locationData.villageId
    ) {
      alert(
        "Silakan lengkapi Provinsi, Kabupaten/Kota, Kecamatan, dan Desa/Kelurahan.",
      );

      return;
    }

    if (!detailLokasi.trim()) {
      alert("Silakan isi patokan atau detail lokasi.");

      return;
    }

    /* =========================
       DATA LAPORAN
    ========================= */

    const newReport = {
      id: Date.now(),

      userEmail: user.email,

      username: user.username || user.name || "Pengguna",

      title: form.judul.value.trim(),

      category: form.kategori.value,

      categoryLabel: kategoriLabel[form.kategori.value] || "Lainnya",

      description: form.deskripsi.value.trim(),

      location:
        locationData.alamat ||
        `${locationData.desa}, ${locationData.kecamatan}, ${locationData.kabupaten}, ${locationData.provinsi}`,

      lokasi: {
        provinceId: locationData.provinceId,

        regencyId: locationData.regencyId,

        districtId: locationData.districtId,

        villageId: locationData.villageId,

        provinsi: locationData.provinsi,

        kabupaten: locationData.kabupaten,

        kecamatan: locationData.kecamatan,

        desa: locationData.desa,

        alamat: locationData.alamat,

        detail: detailLokasi.trim(),

        latitude: locationData.latitude,

        longitude: locationData.longitude,
      },

      photo: photoPreview || "",

      photoName: selectedPhoto?.name || "",

      status: "Menunggu",

      statusClass: "waiting",

      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),

      createdAt: new Date().toISOString(),

      timeline: [
        {
          title: "Laporan dikirim",
          description:
            "Laporan berhasil dikirim dan sedang menunggu pemeriksaan.",
          date: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          completed: true,
        },
        {
          title: "Laporan diverifikasi",
          description: "Laporan akan diperiksa oleh petugas.",
          completed: false,
        },
        {
          title: "Dalam proses",
          description: "Laporan sedang ditindaklanjuti.",
          completed: false,
        },
        {
          title: "Selesai",
          description: "Permasalahan telah selesai ditangani.",
          completed: false,
        },
      ],
    };

    /* =========================
       AMBIL DATA LAMA
    ========================= */

    let existingReports;

    try {
      const parsedReports = JSON.parse(
        localStorage.getItem("laporanSaya") || "[]",
      );

      existingReports = Array.isArray(parsedReports) ? parsedReports : [];
    } catch {
      existingReports = [];
    }

    /* =========================
       MASUKKAN LAPORAN TERBARU
    ========================= */

    existingReports.unshift(newReport);

    /* =========================
       SIMPAN
    ========================= */

    localStorage.setItem("laporanSaya", JSON.stringify(existingReports));

    /* =========================
       EVENT UPDATE
    ========================= */

    window.dispatchEvent(new Event("laporanUpdated"));

    console.log("DATA LAPORAN:", newReport);

    alert("Laporan berhasil dikirim!");

    window.location.href = "/laporan-saya";
  };

  return (
    <main className="buat-laporan-page">
      <div className="buat-laporan-background">
        <div className="buat-laporan-grid"></div>

        <div className="buat-laporan-orb buat-laporan-orb-one"></div>

        <div className="buat-laporan-orb buat-laporan-orb-two"></div>
      </div>

      <header className="buat-laporan-header">
        <a href="/" className="buat-laporan-back">
          <span>←</span>
          Kembali
        </a>

        <div className="buat-laporan-heading">
          <div className="buat-laporan-label">
            <span className="buat-laporan-label-dot"></span>
            LAPORKITA
          </div>

          <h1>Sampaikan laporanmu</h1>

          <p>
            Bantu kami mengetahui permasalahan di sekitarmu dengan memberikan
            informasi yang jelas dan lengkap.
          </p>
        </div>
      </header>

      <section className="buat-laporan-card">
        <form className="buat-laporan-form" onSubmit={handleSubmit}>
          {/* ========================================
              01 INFORMASI
          ======================================== */}

          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-number">01</div>

              <div>
                <h2>Informasi laporan</h2>

                <p>Jelaskan permasalahan yang ingin kamu laporkan.</p>
              </div>
            </div>

            <div className="laporan-form-group">
              <label htmlFor="judul">
                Judul laporan
                <span>*</span>
              </label>

              <input
                id="judul"
                name="judul"
                type="text"
                placeholder="Contoh: Jalan berlubang di depan pasar"
                required
              />
            </div>

            <div className="laporan-form-group">
              <label htmlFor="kategori">
                Kategori
                <span>*</span>
              </label>

              <select id="kategori" name="kategori" defaultValue="" required>
                <option value="" disabled>
                  Pilih kategori laporan
                </option>

                <option value="jalan">Jalan dan transportasi</option>

                <option value="fasilitas">Fasilitas umum</option>

                <option value="penerangan">Penerangan jalan</option>

                <option value="lingkungan">Lingkungan</option>

                <option value="drainase">Drainase dan saluran air</option>

                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div className="laporan-form-group">
              <label htmlFor="deskripsi">
                Deskripsi masalah
                <span>*</span>
              </label>

              <textarea
                id="deskripsi"
                name="deskripsi"
                rows="6"
                placeholder="Jelaskan kondisi atau permasalahan yang kamu temukan secara rinci..."
                required
              ></textarea>

              <small>
                Jelaskan kondisi masalah dan informasi lain yang dapat membantu
                memahami laporan.
              </small>
            </div>
          </div>

          {/* ========================================
              02 LOKASI
          ======================================== */}

          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-number">02</div>

              <div>
                <h2>Lokasi kejadian</h2>

                <p>
                  Tentukan lokasi laporan secara otomatis atau pilih wilayah
                  secara manual.
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

                  <p>GPS akan membantu mengisi wilayah secara otomatis.</p>
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
                <div className="location-error">
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
                    Pilih wilayah secara manual jika hasil GPS belum sesuai.
                  </div>
                </div>

                {locationFound && (
                  <div className="location-status">GPS AKTIF</div>
                )}
              </div>

              <div className="location-detail-grid">
                <div className="location-edit-field">
                  <label htmlFor="provinsi">Provinsi</label>

                  <select
                    id="provinsi"
                    value={locationData.provinceId}
                    onChange={handleProvinceChange}
                  >
                    <option value="">
                      {loadingProvince
                        ? "Memuat provinsi..."
                        : "Pilih provinsi"}
                    </option>

                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-edit-field">
                  <label htmlFor="kabupaten">Kabupaten / Kota</label>

                  <select
                    id="kabupaten"
                    value={locationData.regencyId}
                    onChange={handleRegencyChange}
                    disabled={!locationData.provinceId || loadingRegency}
                  >
                    <option value="">
                      {loadingRegency
                        ? "Memuat kabupaten/kota..."
                        : !locationData.provinceId
                          ? "Pilih provinsi dahulu"
                          : "Pilih kabupaten / kota"}
                    </option>

                    {regencies.map((regency) => (
                      <option key={regency.id} value={regency.id}>
                        {regency.name}
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
                    disabled={!locationData.regencyId || loadingDistrict}
                  >
                    <option value="">
                      {loadingDistrict
                        ? "Memuat kecamatan..."
                        : !locationData.regencyId
                          ? "Pilih kabupaten/kota dahulu"
                          : "Pilih kecamatan"}
                    </option>

                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-edit-field">
                  <label htmlFor="desa">Desa / Kelurahan</label>

                  <select
                    id="desa"
                    value={locationData.villageId}
                    onChange={handleVillageChange}
                    disabled={!locationData.districtId || loadingVillage}
                  >
                    <option value="">
                      {loadingVillage
                        ? "Memuat desa/kelurahan..."
                        : !locationData.districtId
                          ? "Pilih kecamatan dahulu"
                          : "Pilih desa / kelurahan"}
                    </option>

                    {villages.map((village) => (
                      <option key={village.id} value={village.id}>
                        {village.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-edit-field location-edit-field-full">
                  <label htmlFor="alamat">Alamat terdeteksi</label>

                  <textarea
                    id="alamat"
                    rows="3"
                    value={locationData.alamat}
                    onChange={(e) =>
                      setLocationData((prev) => ({
                        ...prev,
                        alamat: e.target.value,
                      }))
                    }
                    placeholder="Alamat lengkap..."
                  ></textarea>

                  <div className="location-address-help">
                    <span>i</span>

                    <p>
                      Mohon maaf jika alamat yang terdeteksi kurang sesuai. Kamu
                      dapat mengubah alamat di atas dengan alamat yang benar
                      agar lokasi laporan lebih akurat.
                    </p>
                  </div>
                </div>

                <div className="location-edit-field location-edit-field-full">
                  <label htmlFor="detailLokasi">
                    Patokan / detail lokasi
                    <span>*</span>
                  </label>

                  <textarea
                    id="detailLokasi"
                    rows="3"
                    value={detailLokasi}
                    onChange={(e) => setDetailLokasi(e.target.value)}
                    placeholder="Contoh: di depan minimarket, dekat lampu merah, sebelah sekolah..."
                    required
                  ></textarea>

                  <small>
                    Tambahkan patokan agar lokasi lebih mudah ditemukan.
                  </small>
                </div>
              </div>

              {locationFound && (
                <div className="location-coordinate">
                  <div>
                    <span className="coordinate-label">Koordinat GPS</span>

                    <strong>
                      {locationData.latitude}
                      {" , "}
                      {locationData.longitude}
                    </strong>
                  </div>

                  <span className="coordinate-badge">GPS</span>
                </div>
              )}

              <div className="location-edit-info">
                <span>✎</span>

                <p>
                  Wilayah bisa diubah secara manual. Kecamatan mengikuti
                  Kabupaten/Kota dan Desa/Kelurahan mengikuti Kecamatan.
                </p>
              </div>
            </div>

            <div className="location-note">
              <span className="location-note-icon">i</span>

              <p>
                Urutan wilayah: Provinsi → Kabupaten/Kota → Kecamatan →
                Desa/Kelurahan.
              </p>
            </div>
          </div>

          {/* ========================================
              03 FOTO
          ======================================== */}

          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-number">03</div>

              <div>
                <h2>Foto pendukung</h2>

                <p>Tambahkan foto untuk membantu menjelaskan kondisi.</p>
              </div>
            </div>

            <div className="upload-area">
              <div className="upload-icon">↑</div>

              <h3>Unggah foto</h3>

              <p>Pilih foto dari perangkatmu</p>

              <span>JPG, JPEG, atau PNG · Maksimal 2 MB</span>

              <input
                type="file"
                id="foto"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handlePhotoChange}
              />

              <label htmlFor="foto" className="upload-button">
                Pilih foto
              </label>

              {photoPreview && (
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <img
                    src={photoPreview}
                    alt="Preview foto laporan"
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      maxHeight: "260px",
                      objectFit: "cover",
                      borderRadius: "14px",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />

                  <p
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                    }}
                  >
                    {selectedPhoto?.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================
              SUBMIT
          ======================================== */}

          <div className="laporan-submit">
            <div className="submit-info">
              <span>✓</span>

              <p>
                Pastikan informasi yang kamu masukkan sudah sesuai sebelum
                mengirim laporan.
              </p>
            </div>

            <button type="submit" className="laporan-submit-button">
              <span>Kirim laporan</span>

              <span>→</span>
            </button>
          </div>
        </form>
      </section>

      <footer className="buat-laporan-footer">
        Laporkita · Bersama menyampaikan informasi untuk lingkungan yang lebih
        baik.
      </footer>
    </main>
  );
}

export default BuatLaporan;
