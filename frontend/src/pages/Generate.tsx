import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface FormData {
  companyName: string;
  icpTitle: string;
  problem: string;
  solution: string;
  benefit: string;
  cta: string;
  tone: string;
}

interface FormErrors {
  companyName?: string;
  icpTitle?: string;
  problem?: string;
  solution?: string;
  benefit?: string;
  cta?: string;
  tone?: string;
}

export default function Generate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    icpTitle: "",
    problem: "",
    solution: "",
    benefit: "",
    cta: "",
    tone: "professional",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Character limits
  const limits = {
    companyName: 100,
    icpTitle: 100,
    problem: 500,
    solution: 500,
    benefit: 200,
    cta: 100,
  };

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    if (!value.trim()) {
      return "This field is required";
    }

    const limit = limits[name as keyof typeof limits];
    if (limit && value.length > limit) {
      return `Maximum ${limit} characters`;
    }

    return undefined;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    const requiredFields: (keyof FormData)[] = [
      "companyName",
      "icpTitle",
      "problem",
      "solution",
      "benefit",
      "cta",
    ];

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // If no errors, proceed
    if (Object.keys(newErrors).length === 0) {
      console.log("Form submitted:", formData);
      // TODO: Navigate to output page or trigger generation
    }
  };

  const isFormValid = () => {
    return (
      formData.companyName.trim() &&
      formData.icpTitle.trim() &&
      formData.problem.trim() &&
      formData.solution.trim() &&
      formData.benefit.trim() &&
      formData.cta.trim() &&
      Object.keys(errors).length === 0
    );
  };

  const getCharCount = (field: keyof typeof limits) => {
    const current = formData[field].length;
    const max = limits[field];
    return `${current}/${max}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-2xl py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </button>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Generate Your Cold Email Sequence
              </h1>
              <p className="text-muted-foreground">
                Fill out the form below to generate a SaaS-specific cold email sequence (takes 2-3 minutes)
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Acme Analytics"
                    value={formData.companyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("companyName", e.target.value)}
                    onBlur={() => handleBlur("companyName")}
                    className={errors.companyName ? "border-destructive" : ""}
                    maxLength={limits.companyName}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.companyName ? (
                        <span className="text-destructive">{errors.companyName}</span>
                      ) : (
                        "Your product or company name"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("companyName")}
                    </span>
                  </div>
                </div>

                {/* Product/Solution */}
                <div className="space-y-2">
                  <Label htmlFor="solution">
                    What does your product do? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="solution"
                    placeholder="Real-time analytics dashboard for e-commerce stores. Shows conversion funnels, cart abandonment, and LTV cohorts."
                    value={formData.solution}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("solution", e.target.value)}
                    onBlur={() => handleBlur("solution")}
                    className={errors.solution ? "border-destructive resize-none" : "resize-none"}
                    rows={3}
                    maxLength={limits.solution}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.solution ? (
                        <span className="text-destructive">{errors.solution}</span>
                      ) : (
                        "1-2 sentences describing your product"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("solution")}
                    </span>
                  </div>
                </div>

                {/* Key Benefit */}
                <div className="space-y-2">
                  <Label htmlFor="benefit">
                    Key Benefit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="benefit"
                    placeholder='e.g., "Identify why 60% of carts abandon in under 10 seconds"'
                    value={formData.benefit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("benefit", e.target.value)}
                    onBlur={() => handleBlur("benefit")}
                    className={errors.benefit ? "border-destructive" : ""}
                    maxLength={limits.benefit}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.benefit ? (
                        <span className="text-destructive">{errors.benefit}</span>
                      ) : (
                        "The ONE main benefit prospects care about"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("benefit")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Target Buyer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ICP Title */}
                <div className="space-y-2">
                  <Label htmlFor="icpTitle">
                    Target Job Title(s) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="icpTitle"
                    placeholder="e.g., VP Sales at Series A SaaS, Head of Growth"
                    value={formData.icpTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("icpTitle", e.target.value)}
                    onBlur={() => handleBlur("icpTitle")}
                    className={errors.icpTitle ? "border-destructive" : ""}
                    maxLength={limits.icpTitle}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.icpTitle ? (
                        <span className="text-destructive">{errors.icpTitle}</span>
                      ) : (
                        "Who are you targeting?"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("icpTitle")}
                    </span>
                  </div>
                </div>

                {/* Problem */}
                <div className="space-y-2">
                  <Label htmlFor="problem">
                    Main Pain Point <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="problem"
                    placeholder="They lose 30-40% of revenue to cart abandonment but don't know why"
                    value={formData.problem}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("problem", e.target.value)}
                    onBlur={() => handleBlur("problem")}
                    className={errors.problem ? "border-destructive resize-none" : "resize-none"}
                    rows={3}
                    maxLength={limits.problem}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.problem ? (
                        <span className="text-destructive">{errors.problem}</span>
                      ) : (
                        "What pain point does your product solve?"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("problem")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Call to Action & Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CTA */}
                <div className="space-y-2">
                  <Label htmlFor="cta">
                    Desired Call to Action <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cta"
                    placeholder='e.g., "Book a 15-min demo"'
                    value={formData.cta}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("cta", e.target.value)}
                    onBlur={() => handleBlur("cta")}
                    className={errors.cta ? "border-destructive" : ""}
                    maxLength={limits.cta}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.cta ? (
                        <span className="text-destructive">{errors.cta}</span>
                      ) : (
                        "What do you want prospects to do?"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("cta")}
                    </span>
                  </div>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value: string) => handleChange("tone", value)}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the tone for your email sequence
                  </p>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isFormValid()}
            >
              Generate Sequence
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              All fields marked with * are required
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
