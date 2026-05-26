/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { isEmail, isPhoneNumber, matches } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ChannelType } from 'src/core/repositories/postgres';
import { PersonService } from 'src/core/repositories/postgres';

@ValidatorConstraint({ name: 'isChannelValueValid', async: true })
@Injectable()
export class IsChannelValueValidConstraint implements ValidatorConstraintInterface {
  constructor(private readonly personService: PersonService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const object = args.object as any;

    if (value === undefined || value === null || value === '') {
      return true;
    }

    if (!object?.type) {
      return true;
    }

    let isFormatValid = false;

    switch (object.type) {
      case ChannelType.EMAIL:
        isFormatValid = isEmail(value);
        break;
      case ChannelType.PHONE:
        isFormatValid = isPhoneNumber(value, undefined);
        break;
      case ChannelType.TELEGRAM:
        isFormatValid = matches(value, /^@[a-zA-Z0-9_]{5,32}$/);
        break;
      default:
        return false;
    }

    if (!isFormatValid) return false;

    return !(await this.personService.isChannelExist(object.type, value, object.id));
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;

    switch (object?.type) {
      case ChannelType.EMAIL:
        return 'Некорректный формат Email или данный Email адрес уже зарегистрирован';
      case ChannelType.PHONE:
        return 'Некорректный формат телефона или данный номер уже зарегистрирован';
      case ChannelType.TELEGRAM:
        return 'Некорректный юзернейм Telegram или данный аккаунт уже привязан';
      default:
        return 'Некорректное значение канала связи или канал уже существует';
    }
  }
}

export function IsChannelValue(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsChannelValueValidConstraint,
    });
  };
}
