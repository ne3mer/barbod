"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import type { PublicBusiness, PublicService } from "@/lib/public/business";
import type { AvailableSlot } from "@/lib/booking/availability";
import { useLanguage } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  fetchAvailableSlotsAction,
  createPublicBookingAction,
} from "@/app/(site)/book/actions";

export type ConfirmedBookingSummary = {
  id: string;
  serviceNameEn: string;
  serviceNameHu: string;
  durationMinutes: number;
  price: number;
  currency: string;
  dateStr: string;
  startTimeStr: string;
  customerName: string;
  status: string;
};

interface BookingFlowProps {
  business: PublicBusiness;
  services: PublicService[];
}

export function BookingFlow({ business, services }: BookingFlowProps) {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();

  // Lazy compute initial service from URL parameter
  const initialService = React.useMemo(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && services.length > 0) {
      return services.find((s) => s.id === serviceParam) || null;
    }
    return null;
  }, [searchParams, services]);

  // Wizard Steps: 1=Service, 2=Date & Time, 3=Details, 4=Review, 5=Success
  const [step, setStep] = React.useState<number>(initialService ? 2 : 1);

  // Selected State
  const [selectedService, setSelectedService] = React.useState<PublicService | null>(
    initialService
  );
  const [selectedDate, setSelectedDate] = React.useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(
    null
  );

  // Customer Form State
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Slots loading & error states
  const [availableSlots, setAvailableSlots] = React.useState<AvailableSlot[]>(
    []
  );
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Confirmed booking summary state
  const [confirmedBooking, setConfirmedBooking] =
    React.useState<ConfirmedBookingSummary | null>(null);

  // Load available slots asynchronously when date or service changes
  React.useEffect(() => {
    if (!selectedService || !selectedDate) return;
    let isMounted = true;

    const loadSlots = async () => {
      setLoadingSlots(true);
      setErrorMsg(null);
      setSelectedSlot(null);

      const res = await fetchAvailableSlotsAction(selectedService.id, selectedDate);
      if (!isMounted) return;

      setLoadingSlots(false);
      if (res.error) {
        setErrorMsg(res.error);
        setAvailableSlots([]);
      } else {
        setAvailableSlots(res.slots);
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedService, selectedDate]);

  const handleSelectService = (svc: PublicService) => {
    setSelectedService(svc);
    setErrorMsg(null);
    setStep(2);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setErrorMsg(null);
  };

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg(t.errorRequiredFields);
      return;
    }
    setErrorMsg(null);
    setStep(4);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setErrorMsg(null);

    const res = await createPublicBookingAction({
      businessSlug: business.slug,
      serviceId: selectedService.id,
      dateStr: selectedDate,
      startTimeStr: selectedSlot.timeStr,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    });

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success && res.booking) {
      setConfirmedBooking(res.booking as ConfirmedBookingSummary);
      setStep(5);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-4xl w-full px-4 py-8 sm:px-6 sm:py-12 space-y-8">
      {/* Step Indicator Header */}
      {step < 5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
              {t.bookingTitle}
            </h1>
            <span className="text-xs text-muted-foreground font-medium">
              Step {step} of 4
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/15 p-4 text-sm text-destructive border border-destructive/30 animate-in fade-in">
          <AlertCircle className="size-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT SERVICE */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground font-serif">
            {t.step1Title}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((svc) => {
              const name = getLocalizedField(svc, "name", lang);
              const desc = getLocalizedField(svc, "description", lang);
              const isSelected = selectedService?.id === svc.id;

              return (
                <div
                  key={svc.id}
                  onClick={() => handleSelectService(svc)}
                  className={`flex flex-col justify-between rounded-xl border p-5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-base text-foreground">
                        {name}
                      </h3>
                      <span className="font-bold text-primary text-sm">
                        {svc.price} {svc.currency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {desc || "Professional haircut & styling"}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {svc.duration_minutes} {t.duration}
                    </span>
                    <Button size="xs" variant={isSelected ? "default" : "outline"}>
                      {t.nextStep}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DATE & TIME SLOT */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                Selected Service
              </span>
              <h3 className="text-lg font-bold text-foreground">
                {selectedService && getLocalizedField(selectedService, "name", lang)}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setStep(1)}
              className="gap-1 text-xs"
            >
              <ArrowLeft className="size-3.5" />
              <span>Change Service</span>
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Date Selector */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground font-serif">
                {t.step2Title}
              </h2>

              <div className="space-y-2">
                <Label htmlFor="date_picker" className="text-xs">
                  Date (Europe/Budapest Time)
                </Label>
                <Input
                  id="date_picker"
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full text-sm py-2"
                />
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground font-serif">
                {t.step3Title}
              </h2>

              {loadingSlots ? (
                <div className="flex items-center justify-center p-8 border border-dashed rounded-xl bg-card">
                  <Loader2 className="size-6 animate-spin text-primary mr-2" />
                  <span className="text-xs text-muted-foreground">
                    {t.loadingSlots}
                  </span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-xl text-center bg-card">
                  <p className="text-xs text-muted-foreground">
                    {t.noSlotsAvailable}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.timeStr === slot.timeStr;
                    return (
                      <button
                        key={slot.timeStr}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-muted/40"
                        }`}
                      >
                        {slot.formattedTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-border">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ArrowLeft className="size-4" />
              <span>{t.prevStep}</span>
            </Button>

            <Button
              onClick={() => setStep(3)}
              disabled={!selectedSlot}
              className="gap-1.5 px-6"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: CUSTOMER DETAILS */}
      {step === 3 && (
        <form onSubmit={handleDetailsNext} className="space-y-6">
          <h2 className="text-xl font-bold text-foreground font-serif">
            {t.step4Title}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cust_name">{t.fullName} *</Label>
              <Input
                id="cust_name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_phone">{t.phoneNumber} *</Label>
              <Input
                id="cust_phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust_email">{t.emailAddress}</Label>
            <Input
              id="cust_email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust_notes">{t.notesLabel}</Label>
            <Textarea
              id="cust_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span>{t.prevStep}</span>
            </Button>

            <Button type="submit" className="gap-1.5 px-6">
              <span>{t.nextStep}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && selectedService && selectedSlot && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground font-serif">
            {t.step5Title}
          </h2>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="border-b pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Service
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  {getLocalizedField(selectedService, "name", lang)}
                </h3>
              </div>
              <span className="text-lg font-bold text-primary">
                {selectedService.price} {selectedService.currency}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Date & Time
                </span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <CalendarIcon className="size-4 text-primary" />
                  {selectedDate} at {selectedSlot.formattedTime}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">
                  Duration
                </span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Clock className="size-4 text-primary" />
                  {selectedService.duration_minutes} {t.duration}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">
                  {t.fullName}
                </span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <User className="size-4 text-primary" />
                  {customerName}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">
                  {t.phoneNumber}
                </span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="size-4 text-primary" />
                  {customerPhone}
                </span>
              </div>
            </div>

            {notes && (
              <div className="border-t pt-3 text-xs">
                <span className="text-muted-foreground block font-medium">Notes</span>
                <p className="mt-1 text-foreground bg-muted/40 p-2.5 rounded-lg">
                  {notes}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span>{t.prevStep}</span>
            </Button>

            <Button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="gap-2 px-8 text-base shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t.submittingBooking}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>{t.confirmBooking}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS SCREEN */}
      {step === 5 && confirmedBooking && (
        <div className="py-8 space-y-8 text-center max-w-xl mx-auto">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="rounded-full bg-emerald-500/15 p-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-12" />
            </div>
            <Badge variant="warning">{t.statusBadgePending}</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">
              {t.successHeadline}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.successMessage}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 text-left space-y-3 shadow-xs">
            <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground border-b pb-2">
              {t.bookingDetails}
            </h3>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-semibold text-foreground">
                {lang === "hu"
                  ? confirmedBooking.serviceNameHu
                  : confirmedBooking.serviceNameEn}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date & Time:</span>
              <span className="font-semibold text-foreground">
                {confirmedBooking.dateStr} at {confirmedBooking.startTimeStr}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-semibold text-foreground">
                {confirmedBooking.customerName}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-bold text-primary">
                {confirmedBooking.price} {confirmedBooking.currency}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                {t.backToHome}
              </Button>
            </Link>
            <Button
              onClick={() => {
                setSelectedService(null);
                setSelectedDate("");
                setSelectedSlot(null);
                setCustomerName("");
                setCustomerPhone("");
                setCustomerEmail("");
                setNotes("");
                setStep(1);
              }}
              className="w-full sm:w-auto"
            >
              {t.bookAnother}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
