"use client";
import { useState } from "react";
import { Button, PasswordInput, TextInput } from "@mantine/core";
import { authClient } from "@/lib/auth-client";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    try {
      setLoading(true);
      const { data, error } = await authClient.signUp.email({ email, password, name });

      if (error) throw error;
      alert("Signup successful!");
      console.log(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TextInput 
        label="Full Name" 
        placeholder="John Doe" 
        size="md" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <TextInput 
        label="Email address" 
        placeholder="hello@gmail.com" 
        size="md" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <PasswordInput 
        label="Password" 
        placeholder="Your password" 
        mt="md" 
        size="md" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <Button fullWidth mt="xl" size="md" onClick={onSignUp} loading={loading}>
        Sign Up
      </Button>
    </>
  );
}
