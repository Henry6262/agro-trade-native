"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, CheckCircle } from "lucide-react";

export default function TransporterDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Transporter Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">
          Available deliveries and active transport jobs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Available</CardTitle>
            <Truck className="h-4 w-4 text-brand-wheat" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-cream">0</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">In Transit</CardTitle>
            <Clock className="h-4 w-4 text-brand-amber" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-cream">0</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-cream">0</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-brand-border">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <Truck className="h-12 w-12 text-text-muted mx-auto" />
            <p className="text-text-muted">No deliveries available at this time.</p>
            <p className="text-xs text-text-muted">
              Delivery jobs appear when trades reach the shipping phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
