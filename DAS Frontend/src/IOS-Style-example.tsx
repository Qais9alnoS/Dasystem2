import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IOSSwitch } from "@/components/ui/ios-switch";
import { IOSSlider } from "@/components/ui/ios-slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IOSNavbar } from "@/components/ui/ios-navbar";
import { IOSTabBar } from "@/components/ui/ios-tabbar";
import { IOSList, IOSListItem, IOSListHeader } from "@/components/ui/ios-list";
import { Bell, Mail, Shield, Heart } from "lucide-react";

const IOSDemoPage = () => {
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [segmentValue, setSegmentValue] = useState("first");
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-background">
      {/* iOS Navigation Bar */}
      <IOSNavbar 
        title="iOS Components" 
        onBack={() => window.history.back()} 
        largeTitle={true}
      />
      
      <div className="p-4 pb-24">
        {/* Buttons Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Various iOS-style button variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">+</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>iOS-style inputs and controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            
            <div className="space-y-2">
              <Label>Select Option</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Enable Notifications</Label>
              <IOSSwitch checked={switchValue} onCheckedChange={setSwitchValue} />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Volume</Label>
                <span className="text-muted-foreground">{sliderValue}%</span>
              </div>
              <IOSSlider 
                value={sliderValue} 
                onChange={(e) => setSliderValue(Number(e.target.value))} 
                min="0" 
                max="100" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Segmented Control */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Segmented Control</CardTitle>
            <CardDescription>iOS-style segmented selector</CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              options={[
                { value: "first", label: "First" },
                { value: "second", label: "Second" },
                { value: "third", label: "Third" },
              ]}
              value={segmentValue}
              onValueChange={setSegmentValue}
            />
            <div className="mt-4 p-4 bg-muted rounded-2xl">
              <p>Selected: {segmentValue}</p>
            </div>
          </CardContent>
        </Card>

        {/* Lists Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lists</CardTitle>
            <CardDescription>iOS-style list components</CardDescription>
          </CardHeader>
          <CardContent>
            <IOSList>
              <IOSListHeader>Settings</IOSListHeader>
              <IOSListItem icon={<Bell className="h-5 w-5" />} chevron>
                Notifications
              </IOSListItem>
              <IOSListItem icon={<Mail className="h-5 w-5" />} chevron>
                Messages
              </IOSListItem>
              <IOSListItem icon={<Shield className="h-5 w-5" />} chevron>
                Privacy
              </IOSListItem>
              <IOSListItem icon={<Heart className="h-5 w-5" />} chevron>
                Favorites
              </IOSListItem>
            </IOSList>
          </CardContent>
        </Card>

        {/* Dialog Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dialogs</CardTitle>
            <CardDescription>iOS-style modal dialogs</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>iOS-Style Dialog</DialogTitle>
                  <DialogDescription>
                    This is an example of an iOS-style dialog with rounded corners and subtle shadows.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Dialog content goes here.</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button>Confirm</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* iOS Tab Bar */}
      <IOSTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default IOSDemoPage;