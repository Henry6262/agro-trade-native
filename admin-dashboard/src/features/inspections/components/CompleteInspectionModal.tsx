import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InspectionCompletionMode, InspectionCompletionContext } from '../types';

const formSchema = z.object({
  qualityScore: z
    .number({ invalid_type_error: 'Quality score is required' })
    .min(0)
    .max(100),
  actualQuantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .min(0)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  moistureContent: z
    .number({ invalid_type_error: 'Moisture must be a number' })
    .min(0)
    .max(100)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  notes: z.string().min(3, 'Notes are required'),
  recommendVerification: z.boolean().default(true),
});

export interface CompleteInspectionModalProps {
  open: boolean;
  inspection: InspectionCompletionContext | null;
  mode: InspectionCompletionMode;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
}

export const CompleteInspectionModal: React.FC<CompleteInspectionModalProps> = ({
  open,
  inspection,
  mode,
  loading,
  onClose,
  onSubmit,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qualityScore: mode === 'PASS' ? 85 : 35,
      actualQuantity: undefined,
      moistureContent: undefined,
      notes: '',
      recommendVerification: mode === 'PASS',
    },
  });

  useEffect(() => {
    form.reset({
      qualityScore: mode === 'PASS' ? 85 : 35,
      actualQuantity: undefined,
      moistureContent: undefined,
      notes: '',
      recommendVerification: mode === 'PASS',
    });
  }, [form, mode, inspection]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'PASS' ? 'Mark inspection as passed' : 'Mark inspection as failed'}
          </DialogTitle>
          <DialogDescription>
            {inspection
              ? `Provide the quality findings for ${inspection.saleListing?.seller?.name || 'seller'}.`
              : 'No inspection selected.'}
          </DialogDescription>
        </DialogHeader>

        {inspection ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">
                  {inspection.sellerName || 'Seller'}
                </p>
                <p className="text-slate-500">
                  {inspection.productName || 'Product'}
                </p>
                <p className="text-xs text-slate-500 mt-1">{inspection.address}</p>
              </div>

              <FormField
                control={form.control}
                name="qualityScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality score (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="actualQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verified quantity (tons)</FormLabel>
                  <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ''
                              ? ''
                              : Number(event.target.value),
                          )
                        }
                      />
                  </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moistureContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moisture content (%)</FormLabel>
                  <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ''
                              ? ''
                              : Number(event.target.value),
                          )
                        }
                      />
                  </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Findings / notes</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Describe the inspection outcome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendVerification"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 rounded-md border border-slate-200 p-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="text-sm font-medium">
                        Mark seller as verified
                      </FormLabel>
                      <p className="text-xs text-slate-500">
                        This will allow transport planning to proceed for this seller.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving…' : 'Submit findings'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="text-center text-sm text-slate-500 py-6">
            Select an inspection to complete.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompleteInspectionModal;
