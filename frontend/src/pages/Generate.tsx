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
  targetJobTitle: string;
  problemTheyFace: string;
  yourProduct: string;
  keyBenefit: string;
  callToAction: string;
  tone: string;
}

interface FormErrors {
  companyName?: string;
  targetJobTitle?: string;
  problemTheyFace?: string;
  yourProduct?: string;
  keyBenefit?: string;
  callToAction?: string;
  tone?: string;
}

export default function Generate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    targetJobTitle: "",
    problemTheyFace: "",
    yourProduct: "",
    keyBenefit: "",
    callToAction: "",
    tone: "Professional",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Character limits (from design spec)
  const limits = {
    companyName: { min: 1, max: 50 },
    targetJobTitle: { min: 1, max: 100 },
    problemTheyFace: { min: 10, max: 300 },
    yourProduct: { min: 10, max: 200 },
    keyBenefit: { min: 10, max: 150 },
    callToAction: { min: 10, max: 100 },
  };

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    // Tone is always valid (dropdown)
    if (name === "tone") return undefined;

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "This field is required";
    }

    const limit = limits[name as keyof typeof limits];
    if (limit) {
      if (trimmedValue.length < limit.min) {
        return `Minimum ${limit.min} characters required`;
      }
      if (trimmedValue.length > limit.max) {
        return `Maximum ${limit.max} characters`;
      }
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
      "targetJobTitle",
      "problemTheyFace",
      "yourProduct",
      "keyBenefit",
      "callToAction",
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
      console.log("Form submitted successfully:", formData);
      // Placeholder: Log to console until API integration in Cycle 5
      alert("Form is valid! Check console for data. (API integration coming in Cycle 5)");
    }
  };

  const isFormValid = () => {
    const hasAllFields =
      formData.companyName.trim() &&
      formData.targetJobTitle.trim() &&
      formData.problemTheyFace.trim() &&
      formData.yourProduct.trim() &&
      formData.keyBenefit.trim() &&
      formData.callToAction.trim();

    const hasNoErrors = Object.values(errors).every((error) => !error);

    return hasAllFields && hasNoErrors;
  };

  const getCharCount = (field: keyof typeof limits) => {
    const current = formData[field].length;
    const max = limits[field].max;
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
                <CardTitle className="text-xl">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. Company Name */}
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
                    maxLength={limits.companyName.max}
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

                {/* 2. Target Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="targetJobTitle">
                    Target Job Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="targetJobTitle"
                    placeholder="e.g., VP of Marketing"
                    value={formData.targetJobTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("targetJobTitle", e.target.value)}
                    onBlur={() => handleBlur("targetJobTitle")}
                    className={errors.targetJobTitle ? "border-destructive" : ""}
                    maxLength={limits.targetJobTitle.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.targetJobTitle ? (
                        <span className="text-destructive">{errors.targetJobTitle}</span>
                      ) : (
                        "Who are you targeting?"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("targetJobTitle")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Problem & Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 3. Problem They Face */}
                <div className="space-y-2">
                  <Label htmlFor="problemTheyFace">
                    Problem They Face <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="problemTheyFace"
                    placeholder="e.g., They lose 30-40% of revenue to cart abandonment but don't know why"
                    value={formData.problemTheyFace}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("problemTheyFace", e.target.value)}
                    onBlur={() => handleBlur("problemTheyFace")}
                    className={errors.problemTheyFace ? "border-destructive resize-none" : "resize-none"}
                    rows={3}
                    maxLength={limits.problemTheyFace.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.problemTheyFace ? (
                        <span className="text-destructive">{errors.problemTheyFace}</span>
                      ) : (
                        "What pain point does your product solve? (10-300 chars)"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("problemTheyFace")}
                    </span>
                  </div>
                </div>

                {/* 4. Your Product */}
                <div className="space-y-2">
                  <Label htmlFor="yourProduct">
                    Your Product <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="yourProduct"
                    placeholder="e.g., Real-time analytics dashboard for e-commerce stores. Shows conversion funnels, cart abandonment, and LTV cohorts."
                    value={formData.yourProduct}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("yourProduct", e.target.value)}
                    onBlur={() => handleBlur("yourProduct")}
                    className={errors.yourProduct ? "border-destructive resize-none" : "resize-none"}
                    rows={3}
                    maxLength={limits.yourProduct.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.yourProduct ? (
                        <span className="text-destructive">{errors.yourProduct}</span>
                      ) : (
                        "What does your product do? (10-200 chars)"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("yourProduct")}
                    </span>
                  </div>
                </div>

                {/* 5. Key Benefit */}
                <div className="space-y-2">
                  <Label htmlFor="keyBenefit">
                    Key Benefit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="keyBenefit"
                    placeholder='e.g., "Identify why 60% of carts abandon in under 10 seconds"'
                    value={formData.keyBenefit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("keyBenefit", e.target.value)}
                    onBlur={() => handleBlur("keyBenefit")}
                    className={errors.keyBenefit ? "border-destructive" : ""}
                    maxLength={limits.keyBenefit.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.keyBenefit ? (
                        <span className="text-destructive">{errors.keyBenefit}</span>
                      ) : (
                        "The ONE main benefit prospects care about (10-150 chars)"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("keyBenefit")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Call to Action & Tone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 6. Call to Action */}
                <div className="space-y-2">
                  <Label htmlFor="callToAction">
                    Call to Action <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="callToAction"
                    placeholder='e.g., "Book a 15-min demo"'
                    value={formData.callToAction}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("callToAction", e.target.value)}
                    onBlur={() => handleBlur("callToAction")}
                    className={errors.callToAction ? "border-destructive" : ""}
                    maxLength={limits.callToAction.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.callToAction ? (
                        <span className="text-destructive">{errors.callToAction}</span>
                      ) : (
                        "What do you want prospects to do? (10-100 chars)"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("callToAction")}
                    </span>
                  </div>
                </div>

                {/* 7. Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">
                    Tone <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value: string) => handleChange("tone", value)}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
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
