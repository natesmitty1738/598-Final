'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Book, FileQuestion, MessageCircle, Video, FileText, Mail } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-xl text-muted-foreground">
          Get answers and learn how to use MerchX
        </p>
        
        <div className="mt-8 relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search help articles..."
            className="block w-full pl-10 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
        <HelpCard
          icon={<Book className="h-6 w-6 text-indigo-500" />}
          title="Getting Started"
          description="Learn the basics of setting up and using MerchX."
          link="/help/getting-started"
        />
        <HelpCard
          icon={<FileQuestion className="h-6 w-6 text-amber-500" />}
          title="FAQs"
          description="Answers to common questions about our platform."
          link="/help/faq"
        />
        <HelpCard
          icon={<Video className="h-6 w-6 text-emerald-500" />}
          title="Tutorials"
          description="Step-by-step videos to master MerchX features."
          link="/help/tutorials"
        />
        <HelpCard
          icon={<FileText className="h-6 w-6 text-blue-500" />}
          title="Guides"
          description="Detailed guides for each feature and functionality."
          link="/help/guides"
        />
        <HelpCard
          icon={<MessageCircle className="h-6 w-6 text-rose-500" />}
          title="Community"
          description="Connect with users to share tips and get help."
          link="/help/community"
        />
        <HelpCard
          icon={<Mail className="h-6 w-6 text-purple-500" />}
          title="Support"
          description="Contact our team with specific questions."
          link="/contact"
        />
      </div>
      
      <div className="max-w-4xl mx-auto bg-card rounded-lg p-8 border border-border shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Popular Articles</h2>
        <ul className="space-y-4">
          <HelpArticleLink title="How to set up your first inventory item" link="/help/articles/setup-inventory" />
          <HelpArticleLink title="Setting up user permissions and roles" link="/help/articles/user-permissions" />
          <HelpArticleLink title="Importing inventory from spreadsheets" link="/help/articles/import-inventory" />
          <HelpArticleLink title="Generating and understanding reports" link="/help/articles/reports-guide" />
          <HelpArticleLink title="Setting up low stock alerts" link="/help/articles/stock-alerts" />
        </ul>
      </div>
    </div>
  );
}

function HelpCard({ 
  icon, 
  title, 
  description, 
  link 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  link: string;
}) {
  return (
    <Link href={link} className="block">
      <div className="bg-card border border-border rounded-lg p-6 transition-shadow hover:shadow-md h-full">
        <div className="mb-4 bg-primary/5 p-3 rounded-lg inline-block">
          {icon}
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function HelpArticleLink({ title, link }: { title: string; link: string }) {
  return (
    <li>
      <Link 
        href={link} 
        className="block p-3 rounded-lg hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-muted-foreground mr-3" />
          <span>{title}</span>
        </div>
      </Link>
    </li>
  );
} 