"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import {Prisma, TypeOfVote, TypePost } from '@prisma/client';
import { JSONContent } from "@tiptap/react";
import { revalidatePath } from "next/cache";

const postTypes = {
  IMAGE: TypePost.IMAGE,
  VIDEO: TypePost.VIDEO,
  POST: TypePost.POST,
};
export async function updateUsername(prevState: any, formData: FormData) {
  const {getUser} = getKindeServerSession()
  const user = await getUser()
  if(!user) {
    return redirect("/api/auth/login")
  }
  const username = formData.get("username") as string;


  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        userName: username,
      },
    });

    return {
      message: "Successfully Updated name",
      status: "green",
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          message: "This username is already used",
          status: "error",
        };
      }
    }

    throw e;
  }
}

export async function createCommunity(prevState: any, formData: FormData) {
  const {getUser} = getKindeServerSession();
  const user = await getUser();
  
  if(!user){
    return redirect ("/api/auth/login")
  }

  try {
    const name = formData.get('name') as string

    const data = await prisma.subreddit.create({
      data:{
        name: name,
        // id: user.id,
      }
    })
    return redirect ("/")
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2001") {
        return {
          message: "This community name is already used",
          status: "error",
        };
      }
    }
    throw e;
  }
}

export async function updateCommunityDescription(prevState: any, formData: FormData) {
  const {getUser} = getKindeServerSession();
  const user = await getUser();

  if(!user){
    return redirect ("/api/auth/login");
  }

  try {
    const subName = formData.get("subName") as string;
  const description = formData.get("description") as string;

  await prisma.subreddit.update({
    where: {
      name: subName,
    }, 
    data: {
      description: description,
    }
  });

  return{
    status: "green",
    message: "Successfully updated the community description!!"
  }
  } catch (e) {
    return{
      status: "error",
      message: "Something went wrong"
    }
  }
}

export async function createPostAction({jsonContent} : {jsonContent: JSONContent | null}, formData: FormData) {
  const {getUser} = getKindeServerSession();
  const user = await getUser();

  if(!user){
    return redirect ("/api/auth/login")
  }

  const title = formData.get("title") as string
  const imageUrl = formData.get("imageUrl") as string | null
  const subName = formData.get("subName") as string
  await prisma.post.create({
    data: {
      User: {},
      title: title,
      textContent: jsonContent ?? undefined,
      imageString: imageUrl ?? undefined,
      type: TypePost.POST || TypePost.VIDEO || TypePost.IMAGE
    }
  });
  return redirect("/")
}
export async function handleVote(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect("/api/auth/login");
  }

  const postId = formData.get("postId") as string;
  const voteDirection = formData.get("voteDirection") as TypeOfVote;

  const vote = await prisma.vote.findFirst({
    where: {
      postId: postId,
      userId: user.id,
    },
  });

  if (vote) {
    if (vote.voteType === voteDirection) {
      await prisma.vote.delete({
        where: {
          id: vote.id,
        },
      });

      return revalidatePath("/", "page");
    } else {
      await prisma.vote.update({
        where: {
          id: vote.id,
        },
        data: {
          voteType: voteDirection,
        },
      });
      return revalidatePath("/", "page");
    }
  }

  await prisma.vote.create({
    data: {
      voteType: voteDirection,
      // userId: user.id,
      postId: postId,
    },
  });

  return revalidatePath("/", "page");
}

export async function createComment(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect("/api/auth/login");
  }

  const comment = formData.get("comment") as string;
  const postId = formData.get("postId") as string;

  const data = await prisma.comment.create({
    data: {
      text: comment,
      // userId: user.id,
      postId: postId,
    },
  });

  revalidatePath(`/post/${postId}`);
}