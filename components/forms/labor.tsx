import { MailIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

const FormLayout = () => {
  return (
    <form>
      {/* Personal Information */}
      <div className='grid grid-cols-1 gap-10'>
        <div className='space-y-1'>
          <h2 className='font-semibold'>Personal Information</h2>
          <p className='text-muted-foreground text-sm'>Enter your contact details and address information.</p>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:col-span-2'>
          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='first-name'>First Name</Label>
            <Input id='first-name' placeholder='John' />
            <p className='text-muted-foreground text-xs'>Your legal first name</p>
          </div>

          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='last-name'>Last Name</Label>
            <Input id='last-name' placeholder='Doe' />
            <p className='text-muted-foreground text-xs'>Your legal last name</p>
          </div>

          <div className='flex flex-col gap-2 sm:col-span-2'>
            <Label htmlFor='email'>Email Address</Label>
            <div className='relative'>
              <Input id='email' type='email' placeholder='Email address' className='peer pr-9' />
              <div className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
                <MailIcon className='size-4' />
                <span className='sr-only'>Email</span>
              </div>
            </div>
            <p className='text-muted-foreground text-xs'>We&apos;ll never share your email with anyone else</p>
          </div>

          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='mobile'>Mobile</Label>
            <Input id='mobile' type='tel' placeholder='+1 (555) 123-4567' />
            <p className='text-muted-foreground text-xs'>Include country code for international numbers</p>
          </div>

          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='pincode'>Pincode</Label>
            <Input id='pincode' placeholder='10001' />
            <p className='text-muted-foreground text-xs'>5-digit postal code</p>
          </div>

          <div className='flex flex-col items-start gap-2 sm:col-span-2'>
            <Label htmlFor='address'>Address</Label>
            <Input id='address' placeholder='123 Main St, Apt 4B' />
            <p className='text-muted-foreground text-xs'>Street address with apartment or suite number</p>
          </div>

          <div className='flex flex-col items-start gap-2 sm:col-span-2'>
            <Label htmlFor='landmark'>Landmark</Label>
            <Input id='landmark' placeholder='Near Central Park' />
            <p className='text-muted-foreground text-xs'>Optional nearby landmark for easier location</p>
          </div>

          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='city'>City</Label>
            <Input id='city' placeholder='New York' />
          </div>

          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='state'>State</Label>
            <Input id='state' placeholder='NY' />
          </div>
        </div>
      </div>

      <Separator className='my-10' />

      {/* Workspace Setting */}
      <div className='grid grid-cols-1 gap-10'>
        <div className='space-y-1'>
          <h2 className='font-semibold'>Workspace Settings</h2>
          <p className='text-muted-foreground text-sm'>Configure your workspace preferences and visibility options.</p>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:col-span-2'>
          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='workspace-name'>Workspace Name</Label>
            <Input id='workspace-name' placeholder='My Workspace' />
            <p className='text-muted-foreground text-xs'>Choose a unique name for your workspace</p>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='visibility'>Visibility</Label>
            <Select defaultValue='public'>
              <SelectTrigger id='visibility' className='w-full'>
                <SelectValue placeholder='Select visibility' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value='public'>Public - Anyone can view</SelectItem>
                  <SelectItem value='private'>Private - Only team members</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>Control who can access your workspace</p>
          </div>

          <div className='flex flex-col gap-2 sm:col-span-2'>
            <Label htmlFor='workspace-description'>Workspace Description</Label>
            <Textarea placeholder='Describe your workspace purpose and goals...' id='workspace-description' rows={4} />
            <p className='text-muted-foreground text-xs'>
              This description is for internal use and won&apos;t be displayed publicly.
            </p>
          </div>
        </div>
      </div>

      <Separator className='my-10' />

      {/* Notification Setting */}
      <div className='grid grid-cols-1 gap-10'>
        <div className='space-y-1'>
          <h2 className='font-semibold'>Notification Settings</h2>
          <p className='text-muted-foreground text-sm'>Choose how you want to receive notifications and updates.</p>
        </div>

        <div className='grid grid-cols-1 gap-6 md:col-span-2 lg:grid-cols-2'>
          <div className='space-y-4'>
            <div>
              <Label className='text-base'>Email Notifications</Label>
              <p className='text-muted-foreground mt-1 text-sm'>Select which emails you&apos;d like to receive.</p>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Checkbox id='marketing' />
                <Label htmlFor='marketing' className='cursor-pointer font-normal'>
                  Marketing and promotional emails
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox id='updates' defaultChecked />
                <Label htmlFor='updates' className='cursor-pointer font-normal'>
                  Product updates and announcements
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox id='security' defaultChecked />
                <Label htmlFor='security' className='cursor-pointer font-normal'>
                  Security alerts and notifications
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox id='digest' />
                <Label htmlFor='digest' className='cursor-pointer font-normal'>
                  Weekly digest of activity
                </Label>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label className='text-base'>Notification Frequency</Label>
              <p className='text-muted-foreground mt-1 text-sm'>How often would you like to receive notifications?</p>
            </div>
            <RadioGroup defaultValue='realtime'>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='realtime' id='realtime' />
                <Label htmlFor='realtime' className='cursor-pointer font-normal'>
                  Real-time notifications
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='daily' id='daily' />
                <Label htmlFor='daily' className='cursor-pointer font-normal'>
                  Daily digest
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='weekly' id='weekly' />
                <Label htmlFor='weekly' className='cursor-pointer font-normal'>
                  Weekly digest
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='never' id='never' />
                <Label htmlFor='never' className='cursor-pointer font-normal'>
                  Never
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      <Separator className='my-10' />

      <div className='flex justify-end gap-3'>
        <Button type='button' variant='outline' className='w-full sm:w-auto'>
          Cancel
        </Button>
        <Button type='submit' className='w-full sm:w-auto'>
          Save Changes
        </Button>
      </div>
    </form>
  )
}

export default FormLayout



