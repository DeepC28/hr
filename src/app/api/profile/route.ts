import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    profile: {
      id: 1,
      avatar: "/images/user/owner.jpg",
      firstName: "Musharof",
      lastName: "Chowdhury",
      title: "ผู้จัดการทีม",
      location: "Phoenix, Arizona, United States",
      email: "randomuser@pimjo.com",
      phone: "+09 363 398 46",
      bio: "ทำงานด้านการบริหารทีมและวางแผนโครงการ",
      address: {
        country: "United States",
        city: "Phoenix",
        state: "Arizona",
        postalCode: "ERT 2489",
        taxId: "AS4568384",
      },
      social: {
        facebook: "https://www.facebook.com/PimjoHQ",
        x: "https://x.com/PimjoHQ",
        linkedin: "https://www.linkedin.com/company/pimjo",
        instagram: "https://instagram.com/PimjoHQ",
      },
      education: [
        {
          level: "ปริญญาโท",
          institution: "Arizona State University",
          field: "Information Systems",
          startYear: 2018,
          endYear: 2020,
          gpa: "3.85",
        },
        {
          level: "ปริญญาตรี",
          institution: "University of Arizona",
          field: "Computer Science",
          startYear: 2014,
          endYear: 2018,
          gpa: "3.72",
        },
        {
          level: "มัธยมปลาย",
          institution: "Phoenix High School",
          field: "Science Program",
          startYear: 2010,
          endYear: 2014,
        },
      ],
    },
  };

  return NextResponse.json(data);
}
