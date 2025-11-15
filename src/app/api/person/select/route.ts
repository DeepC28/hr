import { NextRequest, NextResponse } from "next/server";

type EducationItem = {
  id?: string;
  level: string;
  institute: string;
  major: string;
  startYear: string;
  endYear: string;
  gpa?: string;
  images?: string[];
};

type ProfileFromApi = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  country: string;
  cityState: string;
  postalCode: string;
  taxId: string;
  social: {
    facebook: string;
    x: string;
    linkedin: string;
    instagram: string;
  };
  avatarUrl?: string;
  education: EducationItem[];
};

// สร้างข้อมูลตัวอย่าง
function sampleProfile(id = "u_001"): ProfileFromApi {
  return {
    id,
    firstName: "สุเมธ",
    lastName: "ศรีวงศ์",
    email: "sumet.sriwong@example.com",
    phone: "081-234-5678",
    bio: "หัวหน้าทีมพัฒนาระบบ สนใจ TypeScript และ Next.js",
    country: "ประเทศไทย",
    cityState: "กรุงเทพมหานคร",
    postalCode: "10310",
    taxId: "1103700000000",
    social: {
      facebook: "https://www.facebook.com/example",
      x: "https://x.com/example",
      linkedin: "https://www.linkedin.com/in/example",
      instagram: "https://instagram.com/example",
    },
    avatarUrl: "/images/user/owner.jpg",
    education: [
      {
        id: "edu1",
        level: "ปริญญาตรี",
        institute: "มหาวิทยาลัยตัวอย่าง",
        major: "วิศวกรรมซอฟต์แวร์",
        startYear: "2014",
        endYear: "2018",
        gpa: "3.45",
        images: ["/images/sample/cert-1.jpg"],
      },
      {
        id: "edu2",
        level: "ปริญญาโท",
        institute: "สถาบันเทคโนโลยีตัวอย่าง",
        major: "วิทยาการคอมพิวเตอร์",
        startYear: "2019",
        endYear: "2021",
        gpa: "3.80",
      },
      {
        id: "edu3",
        level: "ประกาศนียบัตรระยะสั้น",
        institute: "Tech Bootcamp",
        major: "UX/UI Design",
        startYear: "2022",
        endYear: "2022",
      },
    ],
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || undefined;
  // ส่งข้อมูลตัวอย่างกลับไป (ถ้ามี id จะใส่ลงไป)
  return NextResponse.json(sampleProfile(id || "u_001"));
}

export async function PUT(req: NextRequest) {
  // ตัวอย่างรับ FormData จากฝั่ง client
  const formData = await req.formData();

  // คุณสามารถอ่านค่าที่ส่งมาได้แบบนี้:
  const id = String(formData.get("id") || "u_001");
  const firstName = String(formData.get("firstName") || "");
  const lastName = String(formData.get("lastName") || "");
  const email = String(formData.get("email") || "");
  const phone = String(formData.get("phone") || "");
  const bio = String(formData.get("bio") || "");
  const country = String(formData.get("country") || "");
  const cityState = String(formData.get("cityState") || "");
  const postalCode = String(formData.get("postalCode") || "");
  const taxId = String(formData.get("taxId") || "");
  const social = {
    facebook: String(formData.get("facebook") || ""),
    x: String(formData.get("x") || ""),
    linkedin: String(formData.get("linkedin") || ""),
    instagram: String(formData.get("instagram") || ""),
  };

  // ไฟล์รูปโปรไฟล์ (ถ้าส่งมา)
  const avatar = formData.get("avatar");
  const hasAvatar = typeof avatar === "object" && avatar !== null;

  // วุฒิการศึกษา (ตัวอย่างอ่านเฉย ๆ)
  const educationLength = Number(formData.get("educationLength") || 0);
  const education: EducationItem[] = [];
  for (let i = 0; i < educationLength; i++) {
    education.push({
      level: String(formData.get(`education[${i}][level]`) || ""),
      institute: String(formData.get(`education[${i}][institute]`) || ""),
      major: String(formData.get(`education[${i}][major]`) || ""),
      startYear: String(formData.get(`education[${i}][startYear]`) || ""),
      endYear: String(formData.get(`education[${i}][endYear]`) || ""),
      gpa: String(formData.get(`education[${i}][gpa]`) || ""),
    });
  }

  // ในตัวอย่างนี้ยังไม่บันทึกจริง แค่ echo กลับให้ดูว่ารับค่าได้
  return NextResponse.json({
    ok: true,
    message: "อัปเดตข้อมูลสำเร็จ (mock)",
    received: {
      id,
      firstName,
      lastName,
      email,
      phone,
      bio,
      country,
      cityState,
      postalCode,
      taxId,
      social,
      education,
      hasAvatar,
    },
  });
}
