import prisma from "@/app/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { use } from "react";
import { generateUsername } from "unique-username-generator";


// const user = await prisma.user.findUnique({ where: { id: someUserId } });
// if (!user) {
//   throw new Error('User not found');
// }
export async function GET() {
    const {getUser} = getKindeServerSession()
    const user = await getUser()

    if(!user || user == null || !user.id) 
        throw new Error("Something went wrong, please try again")

    let dbUser = await prisma.user.findUnique({
        where: {
            id: user.id,
        },
    });

    if(!dbUser){
        dbUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email ?? "",
                firstName: user.given_name ?? "",
                lastName: user.family_name ?? "",
                imageUrl: user.picture,
                userName: generateUsername("_", 3, 20),
            },
        })
    }
    return NextResponse.redirect("http://localhost:3000/");
}