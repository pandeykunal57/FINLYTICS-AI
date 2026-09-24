"use client"; // Ensures this component runs on the client side (needed for hooks like useEffect)

import React, { useEffect, useRef } from "react"; // React core and hooks
import Image from "next/image"; // Optimized image component from Next.js
import { Button } from "@/components/ui/button"; // Custom styled button
import Link from "next/link"; // Client-side navigation

// Functional component for the landing page's hero section
const HeroSection = () => {
  const imageRef = useRef(null); // Reference to the image DOM element for animation

  // Add scroll animation to the image on page scroll
  useEffect(() => {
    const imageElement = imageRef.current; // Get the referenced image element

    const handleScroll = () => {
      const scrollPosition = window.scrollY; // Current vertical scroll position
      const scrollThreshold = 100; // Scroll threshold after which animation triggers

      // Add or remove "scrolled" class based on scroll position
      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    // Attach scroll listener on component mount
    window.addEventListener("scroll", handleScroll);

    // Cleanup: remove listener on component unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="pt-10 pb-20 px-4">
      <div className="container mx-auto text-center">
        {/* Title */}
        <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
          Manage Your Finances <br /> with Intelligence
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          An AI-powered financial management platform that helps you track,
          analyze, and optimize your spending with real-time insights.
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline" className="px-8">
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Hero image with scroll-based animation */}
        <div className="hero-image-wrapper mt-5 md:mt-0">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.webp" // Preview image of the dashboard
              width={1280}
              height={720}
              alt="Dashboard Preview"
              className="rounded-lg shadow-2xl border mx-auto"
              priority // Ensures image is loaded quickly
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;


// HeroSection is the landing page intro section with heading, subheading, CTA buttons, and an animated image.

// The useEffect hook adds a scroll effect to the hero image for visual enhancement.

// Buttons lead to the main dashboard or a demo view.

// Image is optimized with priority loading for better performance.

// Clean, mobile-responsive layout with TailwindCSS classes.