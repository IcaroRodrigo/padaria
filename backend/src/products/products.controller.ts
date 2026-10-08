import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(dto, user.empresaId);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: number,
    @Query('active') active?: boolean,
    @Query('expiringDays') expiringDays?: number,
  ) {
    return this.productsService.findAll({ search, categoryId, active, expiringDays }, user.empresaId);
  }

  @Get('export/balanca')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async exportBalanca(@CurrentUser() user: any, @Res() res: Response) {
    const content = await this.productsService.exportBalanca(user.empresaId);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ITENSMGV.txt"');
    res.send(Buffer.from(content, 'latin1'));
  }

  @Get('categories')
  getCategories(@CurrentUser() user: any) {
    return this.productsService.getCategories(user.empresaId);
  }

  @Get('plu/next')
  getNextPlu(@CurrentUser() user: any) {
    return this.productsService.getNextPlu(user.empresaId);
  }

  @Get('plu/:plu')
  findByPlu(@Param('plu', ParseIntPipe) plu: number, @CurrentUser() user: any) {
    return this.productsService.findByPlu(plu, user.empresaId);
  }

  @Post('bulk-import')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  bulkImport(
    @Body() body: { products: { name: string; plu: number; salePrice: number; unit: string; categoryName: string }[] },
    @CurrentUser() user: any,
  ) {
    return this.productsService.bulkImport(body.products, user.empresaId);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createCategory(@Body('name') name: string, @CurrentUser() user: any) {
    return this.productsService.createCategory(name, user.empresaId);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deleteCategory(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.productsService.deleteCategory(id, user.empresaId);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string, @CurrentUser() user: any) {
    return this.productsService.findByBarcode(barcode, user.empresaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.productsService.findOne(id, user.empresaId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateProductDto>, @CurrentUser() user: any) {
    return this.productsService.update(id, dto, user.empresaId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.productsService.remove(id, user.empresaId);
  }
}
